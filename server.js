const inquirer = require('inquirer');
const mysql = require('mysql2');
const cTable = require('console.table');


const connection = mysql.createConnection( {
    host: 'localhost',
    port: 4608,
    user: 'root',
    password: '',
    database: 'employeeTracker_db',
});

connection.connect((err) => {
    if (err) throw err
    console.log("Connected to the database!");
    // Start the application
    start();
});

// function for Employee Tracker Application
function start() {
    inquirer
        .prompt({
            type: 'list',
            name: 'action',
            message: 'What would you like to do?',
            choices: [
                'View all departments',
                'View all roles',
                'View all employees',
                'Add a department',
                'Add a role',
                'Add an employee',
                'Update an employee role',
                'View Employees by Department',
                'Exit',
            ],
        }) 
        .then(function(val) {
            switch (val.action) {
                case 'View all departments':
                    viewAllDepartments();
                    break;
                case 'View all roles':
                    viewAllRoles();
                    break;
                case 'View all employees':
                    viewAllEmployees();
                    break;
                case 'Add a department':
                    addDepartment();
                    break;
                case 'Add a role':
                    addRole();
                    break;
                case 'Add an employee':
                    addEmployee();
                    break;
                case 'Update an employee role':
                    updateEmployeeRole();
                    break;
                case 'Exit':
                    connection.end();
                    console.log('Goodbye!');
                    break;
            }
        });
}

function viewAllDepartments() {
    const query = 'SELECT employee.first_name, employee.last_name, department.name AS Department FROM employee JOIN department ON role.department_id = department.id ORDER BY employee.id';
    connection.query(query, (err, res) => {
        if (err) throw err;
        console.table(res)

        start();
    })
}

function viewAllRoles() {
    const query = 'SELECT employee.first_name, employee.last_name, role.title AS Title FROM employee JOIN role ON employee.role_id = role.id';
    connection.query(query, (err, res) => {
        if (err) throw  err;
        console.table(res);

        start();
    });
}

function viewAllEmployees() {
    const query = `
    SELECT e.id, e.first_name, e.last_name, r.title, d.department_name, r.salary, CONCAT(m.first_name, ' ', m.last_name) AS manager_name
    FROM employee e
    LEFT JOIN roles r ON e.role_id = r.id
    LEFT JOIN departments d ON r.department_id = d.id
    LEFT JOIN employee m ON e.manager_id = m.id
    `;
    connection.query(query, (err, res) => {
        if (err) throw err;
        console.table(res);

        start();
    });
}

function addDepartment(){
    inquirer.prompt({
        type: 'input',
        name: "name",
        message: "Enter the name of the new department",
    }).then((answer) => {
        console.log(answer.name);
        const query = `INSERT INTO departments (department_name) VALUES ("${answer.name}")`;
        connection.query(query, (err, res) => {
            if (err) throw err;
            console.log(`Added department ${answer.name} to the database!`);
            // Restart
            start();
            console.log(answer.name);
        });
    });
}

function addRole(){
    const query = "SELECT * FROM departments";
    connection.query(query, (err, res) => {
        if (err) throw err;
        inquirer.prompt([
            {
                type: 'input',
                name: 'title',
                message: 'Enter the title of the new role:',
            },
            {
                type: 'input',
                name: 'salary',
                message: 'Enter the salary of the new role:',
            },
            {
                type: 'list',
                name: 'department',
                message: 'Select the department for the new role',
                choices: res.map(
                    (department) => department.department_name
                ),
            },
        ]).then((answers) => {
            const department = res.find(
                (department) => department.name === answers.department
            );
            const query = 'INSERT INTO roles SET?';
            connection.query(
                query, 
                {
                    title: answers.title,
                    salary: answers.salary,
                    department_id: department,
                },
                (err, res) => {
                    if(err) throw err;
                    console.log(`Added role ${answers.title} with salary ${answers.salary} to the ${answers.department} department in the database!`
                    );
                    start();
                }
            );
        });
    });
}

function addEmployee(){
    inquirer.prompt([
        {
            name: 'firstname',
            type: 'input',
            message: 'Enter their first name'
        },
        {
            name: 'lastname',
            type: 'input',
            message: 'Enter their last name'
        },
        {
            name: 'role',
            type: 'list',
            message: 'What is their role?',
            choices: selectRole()
        },
        {
            name: 'choice',
            type: 'rawlist',
            message: 'Whats their managers name?',
            choices: selectManager()
        }
    ]).then(function (val) {
        var roleId = selectRole().indexof(val.role) + 1
        var managerId = selectManager().indexof(val.choices) + 1
        connection.query('INSERT INTO employee SET ?',
        {
            first_name: val.firstName,
            last_name: val.lastName,
            manager_id: managerId,
            role_id: roleId

        }, 
        function(err){
            if(err) throw err
            console.table(val)
            start();
        })
    })
}

function updateEmployeeRole(){
    const queryEmployees = 
    'SELECT employee.id, employee.first_name, employee.last_name, roles.title FROM employee LEFT JOIN roles ON employee.role_id = roles.id';
    const queryRoles = 'SELECT * FROM roles';
    connection.query(queryEmployees, (err, resEmployees) => {
        if (err) throw err;
        connection.query(queryRoles, (err, resRoles) => 
        {
            if (err) throw err;
            inquirer
            .prompt([
                {
                    type: 'list',
                    name: 'employee',
                    message: 'Select the employee to update:',
                    choices: resEmployees.map(
                    (employee) => 
                        `${employee.first_name} ${employee.last_name}`
                    ),
                },
                {
                    type: 'list',
                    name: 'role',
                    message: 'Select the new role:',
                    choices: resRoles.map((role) => role.title),
                },
            ]) .then((answers) => {
                const employee = resEmployees.find(
                    (employee) =>
                    `${employee.first_name} ${employee.last_name}` ===
                    answers.employee
                );
                const role = resRoles.find(
                    (role) => role.title === answers.role
                );
                const query = 
                'UPDATE employee SET role_id = ? WHERE id = ?';
                connection.query(
                    query,
                    [role.id, employee.id],
                    (err, res) => {
                        if (err) throw err;
                        console.log(
                            `Updated ${employee.first_name} ${employee.last_name}'s role to ${role.title} in the databse`
                        );
                        start();
                    }
                )
            })
        })
    })
}