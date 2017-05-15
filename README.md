# todolist-network-hlfv1

In order to create an Todo List app that is backed by Blockchain, you need to install the following:

 * [Docker](https://www.docker.com/) version 17.03 or later
 * [Docker-compose](https://docs.docker.com/compose/) version 1.11.2 or later
 * [Node.js](https://nodejs.org/en/) version 6.10.X
 * [npm](https://www.npmjs.com/) version 4.4.4 or later
 * [Hyperledger Composer](https://hyperledger.github.io/composer/introduction/introduction.html) version 0.7.1 or later
 * [Yeoman](http://yeoman.io/) Generator version 1.8.5 or later


Once you have Docker and Docker-compose installed, you can download and and start Hyperledger Fabric v1.0 as shown below:

```
$ cd ~/Workdir
$ git clone https://github.com/sanjay-saxena/todolist-network-hlfv1
$ cd ~/Workdir/todolist-network-hlfv1
$ npm install
$ ./scripts/downloadHyperledger.sh
$ ./scripts/startHyperledger.sh
```

Hyperledger Composer provides higher-level abstractions to hide the complexity of the blockchain technologies that are implemented as part of Hyperledger Fabric. A Blockchain app that is built by Hyperledger Composer relies on a `Business Network` as an abstraction that helps orchestrate the transfer of assets. A `Business Network` comprises of `Business Model`, `Business Logic`, and `Access Control Lists`.

The following sections provide the steps for creating the Todo List app backed by Blockchain. The Todo List Business Network is extremely simple and does not have support for authentication or authorization and so it will only contain the `Business Model` and `Business Logic` and there is no `Access Control Lists` defined in the network. The repo includes some scripts for creating a Business Network Archive(.bna), deploying the archive to Hyperledger Fabric, etc. for convenience.

## Define a Business Model

Business Model consists of `Participants`, `Assets`, and `Transactions`. It is expressed using a Domain Specific Language called [Concerto](https://hyperledger.github.io/composer/reference/cto_language.html). A very simple business model for Todo List is defined in [models/todo.cto](./models/todo.cto).

The model consists of `Task` type representing an `Asset`. A `Task` is uniquely identified using it's `id`. It also has `state`, `description`, `assignee`, and `creator` attributes.

```
asset Task identified by id {
    o String id
    o String description
    o TaskState state
    --> Superhero assignee optional
    --> Admin creator
}
```

The model also contains `Admin` and `Superhero` types representing `Participants` in the network:

```
abstract participant User identified by email {
  o String email
  o String firstName
  o String lastName
}

participant Superhero extends User {
}

participant Admin extends User {
}

```

A participant is uniquely identified by his/her `email`.

The model also defines the following `Transaction` types:

```
transaction Bootstrap identified by transactionId {
    o String transactionId
}

transaction Assign identified by transactionId {
    o String transactionId
    --> Task task
    --> Superhero assignee
}

transaction Execute identified by transactionId {
    o String transactionId
    --> Task task
}

```

The transactions are used to trigger the Business Logic.

## Implement Business Logic

Hyperledger Composer allows Business Logic to be implemented using Javascript and provides a rich set of APIs to update and query the world state.

The business logic for the Todo List Business Network is implemented in [lib/logic.js](./lib/logic.js). For each of the three transaction types that are defined in the model, there is a corresponding transaction processor function that implements the business logic for that transaction.

For example, when the `Bootstrap` transaction is submitted, Hyperledger Composer runtime will eventually invoke the following `onBootstrap()` function:

```
/**
 * Bootstrap items for convenience.
 * @param {org.example.todolist.hlfv1.Bootstrap} txn -- the bootstrap transaction
 * @transaction
 */
function onBootstrap(txn) {
    ....

    var factory = getFactory();

    // Admin
    var bossman = factory.newInstance('org.example.todolist.hlfv1',
                                      'Admin',
                                      'bobby.da.boss@example.com');
    bossman.firstName = "Bobby";
    bossman.lastName = "Da Boss";
    admins.push(bossman);

    var catwoman = factory.newInstance('org.example.todolist.hlfv1',
                                       'Superhero',
                                       'catwoman@example.com');
    catwoman.firstName = "Selina";
    catwoman.lastName = "Kyle";
    superheroes.push(catwoman);

    var batman = factory.newInstance('org.example.todolist.hlfv1',
                                     'Superhero',
                                     'batman@example.com');
    batman.firstName = "Bruce";
    batman.lastName = "Wayne";
    superheroes.push(batman);

    ....

    var task1 = factory.newInstance('org.example.todolist.hlfv1',
                                    'Task',
                                    'T1');
    task1.description = "Build a Bat Mobile!";
    task1.state = 'ACTIVE';
    task1.creator = bossmanForeignKey;
    tasks.push(task1);

    ....

    return getParticipantRegistry('org.example.todolist.hlfv1.Superhero')
           .then(function(shregistry) {
               superheroesRegistry = shregistry;
               return superheroesRegistry.addAll(superheroes);
           })
           .then(function() {
               return getParticipantRegistry('org.example.todolist.hlfv1.Admin');
           })
           .then(function(aregistry) {
               adminRegistry = aregistry;
               return adminRegistry.addAll(admins);
           })
           .then(function() {
               return getAssetRegistry('org.example.todolist.hlfv1.Task');
           })
           .then(function(tregistry) {
               tasksRegistry = tregistry;
               return tasksRegistry.addAll(tasks);
           })
          .catch(function (error) {
              console.log(error);
              throw error;
          })
    ;
}
```

which implements the business logic for `Bootstrap` transaction. The `onBootstrap()` function creates an `Admin` instance for `bobby.da.boss` and `Superhero` instances for `batman`, `catwoman`, `spiderman`, and `superman` as participants. It also creates some `Task` instances to represent assets. The world state is populated using the assets and the participants and the `Bootstrap` transaction is added to the immutable ledger.

So, `bobby.da.boss`(our admin) can assign a task to a specific superhero by submitting the `Assign` transaction. As a result, Hyperledger Composer runtime will invoke the following `onAssignment()` function:

```
/**
 * Assigns the item/task to a superhero.
 * @param {org.example.todolist.hlfv1.Assign} txn -- the Assign transaction
 * @transaction
 */
function onAssignment(txn) {
    var task = txn.task;
    if (task.state !== 'ACTIVE') {
        throw new Error('Task has already been executed');
    }

    task.assignee = txn.assignee;
    return getAssetRegistry('org.example.todolist.hlfv1.Task')
          .then(function(result) {
              result.update(txn.task);
          }
    );
}
```

which updates the task's assignee field and updates the world state appropriately and the `Assign` transaction gets added to the immutable ledger.

And, when a superhero completes a task, he/she can submit the `Execute` transaction. This will result in Hyperledger Composer invoking the following `onExecution()` function:

```
/**
 * Marks the item/task as COMPLETED once it has been successfully dealt with.
 * @param {org.example.todolist.hlfv1.Execute} txn -- the Execute transaction
 * @transaction
 */
function onExecution(txn) {
    var task = txn.task;
    if (task.state !== 'ACTIVE') {
        throw new Error('Task has already been executed');
    }

    task.state = 'COMPLETED';
    return getAssetRegistry('org.example.todolist.hlfv1.Task')
          .then(function(result) {
              result.update(txn.task);
          }
    );
}
```
where the task is updated, world state reflects the change, and the `Execute` transaction gets added to the immutable ledger.

So, the changes to the world state are triggered in response to transactions being submitted and validated. And, eventually the transaction gets added to the immutable ledger.

## Create Business Network Archive

Once the Business Model and Business Logic is ready, they can be packaged up in a Business Network Archive(.bna) as shown below:

```
$ cd ~/Workdir/todolist-network-hlfv1
$ ./scripts/createArchive.sh
```

This will result in the creation of `todolist-network-hlfv1.bna`.

## Deploy Business Network Archive

Assuming that Hyperleder Fabric is running, here is the step to deploy `todolist-network-hflv1.bna` to it:

```
$ cd ~/Workdir/todolist-network-hlfv1
$ ./scripts/deploy.sh
```

## Submit Bootstrap Transaction

In order to populate the world state for convenience, the `Bootstrap` transaction can be submitted as shown below:

```
$ cd ~/Workdir/todolist-network-hlfv1
$ ./scripts/bootstrapTransaction.sh
```

You can use `./scripts/list.sh` to look at the assets that were created by the `Bootstrap` transaction.

## Generate Angular2 app

Here is the step to generate the Angular2 app for Todo List using Yeoman:

```
$ cd ~/Workdir/todolist-network-hlfv1
$ yo hyperledger-composer:angular

Welcome to the Hyperledger Composer Angular2 skeleton app generator
? Do you want to connect to a running Business Network? Yes
? What is the name of the application you wish to generate?: angular-app
? Description of the application: Skeleton Hyperledger Composer Angular2 project
? Author name: xxxx xxxxx
? Author email: foo@example.com
? What is the Business Network Identifier?: todolist-network-hlfv1
? What is the Connection Profile to use? hlfv1
? Enrollment id: admin
? Enrollment Secret: adminpw
Configuring: angular-app
About to start creating files
About to connect to a running business network
Connected to: todolist-network-hlfv1

....
```

This will result in the generation of Todo List app in the `angular-app` sub-folder.

## Run Todo List Angular2 App

You can run the app as shown below:

```
$ cd ~/Workdir/todolist-network-hlfv1
$ cd angular-app
$ npm start

````

The app will be compiled and you can eventually interact with it by pointing your browser to `http://localhost:4200`.
