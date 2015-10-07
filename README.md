Gigya Developer Toolkit (GDT)
==================

Gigya developer toolkit for common tasks, with a focus on ease-of-use and automation. All tools are available from both a web browser and an interactive command-line. Gigya recommends using the GDT as part of your build process to automate import and validation of Gigya settings instead of managing the process by hand.



### Use online

For convenience, the GDT browser interface is hosted online at: [https://tools.gigya-cs.com/gigya-dev-toolkit/](https://tools.gigya-cs.com/gigya-dev-toolkit/).


### Environments

#### Browser

````npm install```` will install all dependencies and build the app. To start the web server, run ````npm start````. Navigate to [http://localhost:5050](http://localhost:5050).


#### Command-line

````npm -g install gigya-dev-toolkit```` will install the ````gigya-dev-toolkit```` interactive command-line interface on your machine.

The GDT command-line treats the current working directory as it's "project directory". All exported files will be automatically downloaded into the current working directory, the file selection dialog shows you only files in the current working directory, etc. After running a successful command via the interactive interace, the full command with arguments will be shown so that you can easily run the same command again.

##### Save credentials

By default, your user key and user secret need to be entered each time. To save, create an alias for ````gigya-dev-toolkit```` to provide credentials automatically via their command-line arguments.

````
alias gdt="gigya-dev-toolkit --userKey \"USER_KEY_HERE\" --userSecret \"USER_SECRET_HERE\""
````



### Tools


#### Export

Settings can be exported as JSON. You can select multiple settings to export. Once exported, the file can be saved in your source code repository or imported into another API key.


#### Import

Exported setting files can be imported into any API key.


#### Copy

Copy settings between API keys. You can select multiple settings to copy at once.


#### Validation

Settings (sourced from another API key) can be validated against an API key's live settings. If validation fails, the difference between the expected and actual setting will be shown graphically.