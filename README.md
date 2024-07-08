# WECP Roster Script

The West Edmonds Co-Op Roster Script

Created by Dave Martinez (Github: [@mrdave-dev](https://github.com/mrdave-dev))

This script uses Google's App Script to make a Google Sheet usable for real-time attendance for the West Edmonds Co-Op.

Features include:

1. Populate each day of the school year with expected working parents
2. Allow parents to declare someone to cover for them
3. TODO 

## How to set up

1. Install Node.JS 
2. Rename `clasp.json.example` to `clasp.json`
3. Create a new blank Google Sheet
4. TODO

## More documentation

`clasp` documentation: https://developers.google.com/apps-script/guides/clasp#create_a_new_apps_script_project

Apps Script triggers documentation: https://developers.google.com/apps-script/guides/triggers 

Apps Script holds all declared variables in the global scope, but doesn't play nicely with import/export. The solution is to first define the variable then export it in a separate statement. See: https://stackoverflow.com/questions/48791868/use-typescript-with-google-apps-script and https://github.com/google/clasp/blob/master/docs/typescript.md#modules-exports-and-imports 


