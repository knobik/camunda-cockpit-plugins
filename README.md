Minimal "history plugins" for Camunda 7 Cockpit
=================================================

![Minimal history plugin in action.](plugin.gif)

Breaking changes
----------------

* [2021-08-13](https://github.com/datakurre/camunda-cockpit-plugins/tree/66888bcb36f351880835b007b5e75dc44c732fb9): Change definition view plugins (historic activities and instances) to only show data for the current definition version

* [the last version before this changelog](https://github.com/datakurre/camunda-cockpit-plugins/tree/608f7f1d2c240c810dac466890decb91f4da5688)


Try it
------

```bash
$ git clone https://github.com/knobik/camunda-cockpit-plugins.git
$ cd camunda-cockpit-plugins
$ ./setup.sh
$ docker-compose up
```

The `setup.sh` script extracts `camunda-cockpit-ui.js` from the Camunda Docker image into the project root. This file is required because mounting the scripts folder overwrites the original.

Cockpit will be available at http://localhost:8080/app/cockpit (default credentials: `demo`/`demo`).

If you don't immediately see the plugins, try again with your browser's private browsing mode. It is a common issue that the browser has cached a previous Cockpit plugin configuration without these plugins.


Use it
------

### Spring Boot

Copy `config.js` and the files it references to `./src/main/resources/META-INF/resources/webjars/camunda/app/cockpit/scripts`. Once you are done, your project structure should look like this:
```shell
src/main/resources/
├── META-INF
│   ├── resources
│   │   └── webjars
│   │       └── camunda
│   │           └── app
│   │               └── cockpit
│   │                   └── scripts
│   │                       ├── config.js
│   │                       ├── definition-historic-activities.js
│   │                       ├── instance-historic-activities.js
│   │                       ├── instance-route-history.js
│   │                       ├── instance-tab-modify.js
│   │                       ├── robot-module.js
│   │                       ├── tasklist-audit-log.js
│   │                       └── tasklist-config.js
```
After this you can start the project and the plugin should be loaded. Usually, you customize config.js per project and define there which plugins are included and where the browser should find them. You may use a browser network inspector to check that Cockpit loads your version of config.js and also the plugin JavaScript files get loaded.


### Other Distributions

[Check the forum discussion on how to package plugins for various alternative Camunda distributions.](https://forum.camunda.org/t/minimal-cockpit-history-plugins-for-camunda-7-14-0/24651)


Develop it
----------

```bash
$ cd camunda-cockpit-plugins
$ npm install
$ npm run watch
```

When the scripts are mounted into running Docker container, development changes are immediately available in the container with page refresh.
