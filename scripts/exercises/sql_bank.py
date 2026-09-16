import json,sqlite3
DEPARTMENTS=[(1,'Engineering'),(2,'Support'),(3,'Research')]
DATASETS=[
 [(1,'Asha',1,90000,1,None),(2,'Ravi',1,60000,1,1),(3,'Mira',2,50000,1,1),(4,'Dev',2,50000,0,3),(5,'Noor',None,70000,1,2),(6,'Isha',1,60000,1,2)],
 [(1,'Asha',1,60000,1,None),(2,'Ravi',2,30000,0,1),(3,'Mira',None,10000,1,1)],
 [],
 [(1,'Asha',1,50000,1,None),(2,'Ravi',1,50000,1,1),(3,'Mira',1,50000,0,1),(4,'Dev',2,50000,1,2)],
 [(5,'Noor',None,0,0,None)],
]
SQL_SPECS=[
 ('Active employees','Return id and name for active employees (active=1), ordered by id.','SELECT id,name FROM employees WHERE active=1 ORDER BY id;','Filter before selecting the two requested columns.'),
 ('Salary threshold','Return id, name, salary for employees earning at least 60,000, ordered by id. Include active and inactive employees.','SELECT id,name,salary FROM employees WHERE salary>=60000 ORDER BY id;','The boundary salary is included.'),
 ('Top three salaries','Return at most three employee rows with id and salary, ordered by salary descending and id ascending for ties.','SELECT id,salary FROM employees ORDER BY salary DESC,id LIMIT 3;','Apply both ordering rules before limiting the row count.'),
 ('Department headcounts','For every department, return department id and employee count, including zero-employee departments. Include inactive employees; order by department id.','SELECT d.id,COUNT(e.id) FROM departments d LEFT JOIN employees e ON e.department_id=d.id GROUP BY d.id ORDER BY d.id;','A left join retains empty departments. Count the employee key, not all joined rows.'),
 ('Above the company average','Return id and salary for employees whose salary is strictly above the average of all employees. Order by id.','SELECT id,salary FROM employees WHERE salary>(SELECT AVG(salary) FROM employees) ORDER BY id;','Compute the company average independently of the outer row filter.'),
 ('Employees without a department','Return id and name for employees with no matching department record, ordered by id. A NULL department_id has no match.','SELECT e.id,e.name FROM employees e LEFT JOIN departments d ON e.department_id=d.id WHERE d.id IS NULL ORDER BY e.id;','Identify unmatched rows with an outer join or NOT EXISTS.'),
 ('Departments with multiple active staff','Return department_id and active employee count for non-NULL departments with at least two active employees. Order by department_id.','SELECT department_id,COUNT(*) FROM employees WHERE active=1 AND department_id IS NOT NULL GROUP BY department_id HAVING COUNT(*)>=2 ORDER BY department_id;','WHERE filters individual rows; HAVING filters completed groups.'),
 ('Second distinct salary per department','For each non-NULL department that has at least two distinct salaries, return department_id and its second-highest distinct salary. One row per qualifying department, ordered by department_id.','WITH ranked AS (SELECT department_id,salary,DENSE_RANK() OVER(PARTITION BY department_id ORDER BY salary DESC) AS r FROM employees WHERE department_id IS NOT NULL) SELECT DISTINCT department_id,salary FROM ranked WHERE r=2 ORDER BY department_id;','Equal salaries share a rank. Deduplicate employees who earn the selected salary.'),
 ('Running department payroll','For every employee, return id and the cumulative salary within that employee’s department, processing increasing id. NULL departments form their own group. Include inactive staff. Final output is ordered by id.','SELECT id,SUM(salary) OVER(PARTITION BY department_id ORDER BY id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) FROM employees ORDER BY id;','Use a partitioned window with an explicit row frame.'),
 ('All reports below manager 1','Return id and name of every direct or indirect report of employee id=1. Exclude employee 1. If employee 1 is absent, return no rows. The reporting graph is acyclic. Order results by id.','WITH RECURSIVE reports(id,name) AS (SELECT e.id,e.name FROM employees e WHERE e.manager_id=1 AND EXISTS(SELECT 1 FROM employees WHERE id=1) UNION ALL SELECT e.id,e.name FROM employees e JOIN reports r ON e.manager_id=r.id) SELECT id,name FROM reports ORDER BY id;','Seed direct reports, then repeatedly join the current reports to their own reports using a recursive CTE.'),
]
def tasks():
 result=[];references=[]
 schema='CREATE TABLE departments(id INTEGER PRIMARY KEY,name TEXT NOT NULL);\nCREATE TABLE employees(id INTEGER PRIMARY KEY,name TEXT NOT NULL,department_id INTEGER,salary INTEGER NOT NULL,active INTEGER NOT NULL,manager_id INTEGER);\n'
 for index,(title,statement,query,hint) in enumerate(SQL_SPECS,1):
  cases=[]
  for i,rows in enumerate(DATASETS):
   conn=sqlite3.connect(':memory:');conn.executescript(schema);conn.executemany('INSERT INTO departments VALUES (?,?)',DEPARTMENTS);conn.executemany('INSERT INTO employees VALUES (?,?,?,?,?,?)',rows)
   setup='\n'.join(x for x in conn.iterdump() if x not in ['BEGIN TRANSACTION;','COMMIT;'])
   expected=json.dumps(conn.execute(query).fetchall(),separators=(',',':'));conn.close()
   cases.append(dict(id=str(i+1),name=f'Sample {i+1}' if i<2 else ['Empty employees','Tied salaries','Unassigned employee'][i-2],input=setup,expected=expected,sample=i<2))
  ident='sql' if index==1 else f'sql__{index:02}'
  result.append(dict(id=ident,topicId='sql',title=title,number=index,difficulty='Easy' if index<=3 else 'Medium' if index<=7 else 'Hard',language='sql',statement=statement,inputFormat='Each test creates a fresh SQLite database using the SQL shown below. Tables: departments(id, name); employees(id, name, department_id, salary, active, manager_id). manager_id references an employee; department_id and manager_id may be NULL.',outputFormat='Write one SELECT query (WITH clauses allowed). The runner displays result rows as a JSON array of arrays, without column headers. Column order and row order must match the requested output. An empty result is [].',constraints=['0–1,000 employees and 1–100 departments','Employee and department IDs are unique positive integers.','Salary is a nonnegative integer; active is 0 or 1.','Reporting relationships contain no cycles.'],cases=cases,starter='-- Write your SQLite SELECT query below.\n-- Use the column order and sorting requested in the problem.\n\n',comparison='tokens',hint=hint))
  references.append(dict(id=ident,query=query,cases=cases))
 return result,references
