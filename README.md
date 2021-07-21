# COVID-19 Contact Tracing Web Application

## How to run?
#### Database
1) Install `Docker`
> https://www.docker.com/products/docker-desktop

2) Use `Docker` to install `Mysql` and `phpmyadmin`
run cmd:
```d
    $ docker pull mysql:latest
    $ docker run -itd --name mysql -p 3306:3306 -e MYSQL_ROOT_PASSWORD=root mysql
    $ docker pull phpmyadmin/phpmyadmin:latest
    $ docker run --name phpmyadmin -d --link mysql -e PMA_HOST="mysql" -p 6061:80 phpmyadmin/phpmyadmin
    $ docker start mysql && docker start phpmyadmin
```

3) Import database
Open `http://localhost:6061` with browser:   
Login in with:
```json
    username: root
    password: root
```
4) Create a database called `contact_tracing`
Import `.sql` files in `/sql`
```d
    1. contact_tracing.sql (create tables <font color="#660000">REQUIRED</font> )
    2. person-test.sql (test data not required)
    3. venue-test.sql (test data not required)
    4. history-test.sql (test data not required)
```
All above is just a simple way to install `Mysql 8`, set it up and import `.sql` files.
You can try your own ways.
#### Node.js
Install `Node.js`
> https://nodejs.org/en/

#### Run project
Run cmd in the root of `index.js`
```d
    $ npm start
```
If there something wrong, you can check `/src/setting.js`