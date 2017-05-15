/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


var bootstrapped = false;
const ROOT_NAMESPACE = 'org.example.todolist.hlfv1';
const BOOTSTRAP = ROOT_NAMESPACE + '.Bootstrap';
const SUPERHERO = ROOT_NAMESPACE + '.Superhero';
const ADMIN = ROOT_NAMESPACE +'.Admin';
const TASK = ROOT_NAMESPACE + '.Task';

/**
 * Bootstrap items for convenience.
 * @param {org.example.todolist.hlfv1.Bootstrap} txn -- the bootstrap transaction
 * @transaction
 */
function onBootstrap(txn) {
    if (bootstrapped) {
        throw new Error("Already bootstrapped");
    }

    bootstrapped = true;

    var tasksRegistry = null;
    var superheroesRegistry = null;
    var adminRegistry = null;
    var superheroes = [];
    var tasks = [];
    var admins = [];
    var factory = getFactory();

    // Admin
    var bossman = factory.newInstance(ROOT_NAMESPACE,
                                      'Admin',
                                      'bobby.da.boss@example.com');
    bossman.firstName = "Bobby";
    bossman.lastName = "Da Boss";
    admins.push(bossman);

    var catwoman = factory.newInstance(ROOT_NAMESPACE,
                                       'Superhero',
                                       'catwoman@example.com');
    catwoman.firstName = "Selina";
    catwoman.lastName = "Kyle";
    superheroes.push(catwoman);

    var batman = factory.newInstance(ROOT_NAMESPACE,
                                     'Superhero',
                                     'batman@example.com');
    batman.firstName = "Bruce";
    batman.lastName = "Wayne";
    superheroes.push(batman);

    var superman = factory.newInstance(ROOT_NAMESPACE,
                                       'Superhero',
                                       'superman@example.com');
    superman.firstName = "Clark";
    superman.lastName = "Kent";
    superheroes.push(superman);

    var spiderman = factory.newInstance(ROOT_NAMESPACE,
                                        'Superhero',
                                        'spiderman@example.com');
    spiderman.firstName = "Peter";
    spiderman.lastName = "Parker";
    superheroes.push(spiderman);

    var bossmanForeignKey = factory.newRelationship(ROOT_NAMESPACE,
                                                    'Admin',
                                                    'bobby.da.boss@example.com');

    var task1 = factory.newInstance(ROOT_NAMESPACE,
                                    'Task',
                                    'T1');
    task1.description = "Build a Bat Mobile!";
    task1.state = 'ACTIVE';
    task1.creator = bossmanForeignKey;
    tasks.push(task1);

    var task2 = factory.newInstance(ROOT_NAMESPACE,
                                    'Task',
                                    'T2');
    task2.description = "Save Lois Lane!";
    task2.state = 'ACTIVE';
    task2.creator = bossmanForeignKey;
    tasks.push(task2);

    var task3 = factory.newInstance(ROOT_NAMESPACE,
                                    'Task',
                                    'T3');
    task3.description = "Buy a gift for Mary Jane!";
    task3.state = 'ACTIVE';
    task3.creator = bossmanForeignKey;
    tasks.push(task3);

    var task4 = factory.newInstance(ROOT_NAMESPACE,
                                    'Task',
                                    'T4');
    task4.description = "Steal a diamond!";
    task4.state = 'ACTIVE';
    task4.creator = bossmanForeignKey;
    tasks.push(task4);

    var task5 = factory.newInstance(ROOT_NAMESPACE,
                                    'Task',
                                    'T5');
    task5.description = "Keep the super heroes busy";
    task5.state = 'ACTIVE';
    task5.creator = bossmanForeignKey;
    tasks.push(task5);

    return getParticipantRegistry(SUPERHERO)
           .then(function(shregistry) {
               superheroesRegistry = shregistry;
               return superheroesRegistry.addAll(superheroes);
           })
           .then(function() {
               return getParticipantRegistry(ADMIN);
           })
           .then(function(aregistry) {
               adminRegistry = aregistry;
               return adminRegistry.addAll(admins);
           })
           .then(function() {
               return getAssetRegistry(TASK);
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
    return getAssetRegistry(TASK)
          .then(function(result) {
              result.update(txn.task);
          }
    );
}

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
    return getAssetRegistry(TASK)
          .then(function(result) {
              result.update(txn.task);
          }
    );
}
