Gigya Developer Toolkit (GDT)
==================

Gigya developer toolkit for common tasks, with a focus on ease-of-use and automation. All tools are available from both a web browser and an interactive command-line. Gigya recommends using the GDT as part of your build process to automate import and validation of Gigya settings instead of managing the process by hand.



### Use online

For convenience, the GDT browser interface is hosted online at: [https://tools.gigya-cs.com/gigya-dev-toolkit/](https://tools.gigya-cs.com/gigya-dev-toolkit/).


### Installation

#### Browser

````npm install gigya-dev-toolkit```` will install all dependencies and build the app. To start the web server, run ````npm start````. Navigate to [http://localhost:5050](http://localhost:5050).


#### Command-line

````npm -g install gigya-dev-toolkit```` will install the ````gigya-dev-toolkit```` interactive command-line interface on your machine.

The command-line utility is designed to assist in automating all GDT tasks as part of your build process. After running a successful command via the interactive interace, the full command with arguments will be shown so that you can easily run the same command again. One common use of the GDT command-line is to validate that your policies/schema/screensets match across environments. (Development = QA/Staging/Production, for example.) It is bad practice to use the Gigya console to manually copy settings between environments.

The GDT command-line treats the current working directory as it's project directory. All exported files will be automatically downloaded into the current working directory, the file selection dialog shows you only files in the current working directory, etc. 

##### Save credentials

By default, your user key and user secret need to be entered each time. To save, create an alias for ````gigya-dev-toolkit```` to provide credentials automatically via their command-line arguments.

````
alias gdt="gigya-dev-toolkit --userKey \"USER_KEY_HERE\" --userSecret \"USER_SECRET_HERE\""
````



### Tutorial

This tutorial uses the browser UI, but all options are identically presented on the interactive command-line. This tutorial will walk you through an example validation task.

Start by entering your user key and user secret key, found within [Gigya's console on the Account page](https://console.gigya.com/site/account.aspx/Settings).
![gigya-keys-input](https://cloud.githubusercontent.com/assets/1831484/10328467/d45d59da-6c69-11e5-9a6f-92addcd411ae.png)

Select one partner ID to perform the task on. If you only have access to one partner ID, this screen will be skipped. In cases where you have access to more partner IDs than can be reasonably shown, you will be asked to enter your partner ID manually.
![partner-id-input](https://cloud.githubusercontent.com/assets/1831484/10328483/18196470-6c6a-11e5-8f33-07a19ad40b35.png)

Select one task.
![gigya-task-selection](https://cloud.githubusercontent.com/assets/1831484/10328509/76ec4508-6c6a-11e5-8cd7-df1f4ccf1713.png)

Select setting(s) to operate on. For example, if you select "Schema", a copy operation would copy the the schema settings, a validation operation would validate only the schema, etc.
![gigya-settings-selection](https://cloud.githubusercontent.com/assets/1831484/10328536/b6a90b90-6c6a-11e5-84eb-0a68a439537a.png)

Select the source Gigya site to pull settings from.
![source-apikey-selection](https://cloud.githubusercontent.com/assets/1831484/10328540/cfd166c6-6c6a-11e5-8988-1bd77a396644.png)

Select the destination Gigya site(s) to operate on. For example, a copy operation would copy to all selected sites.
![destination-apikey-selection](https://cloud.githubusercontent.com/assets/1831484/10328562/19de2bf0-6c6b-11e5-9c2a-d8973235dc6f.png)

The final page will show you the result of the task.
![validate-1](https://cloud.githubusercontent.com/assets/1831484/10328281/8335800c-6c67-11e5-8c62-f6955bd887aa.png)


### Tasks


#### Export

Settings can be exported as JSON. You can select multiple settings to export. Once exported, the file can be saved in your source code repository or imported into another API key.


#### Import

Exported setting files can be imported into API key(s).


#### Copy

Copy settings between API key(s). You can select multiple settings to copy at once and copy to multiple destination API keys.


#### Validation

Settings (sourced from an API key) can be validated against other API key(s) live settings. If validation fails, the difference between the expected and actual setting will be shown graphically.

##### Browser UI

Summaries are shown grouped under the destination API key.
![validate-1](https://cloud.githubusercontent.com/assets/1831484/10328281/8335800c-6c67-11e5-8c62-f6955bd887aa.png)

Click to expand a failed validation to view the difference graphically.
![validate-diff](https://cloud.githubusercontent.com/assets/1831484/10328295/b730673c-6c67-11e5-882f-cde4934548e6.png)

#### Command-line UI

![validate-cli](https://cloud.githubusercontent.com/assets/1831484/10328373/a4f8dd1e-6c68-11e5-9cea-b6cf6af7a614.png)
