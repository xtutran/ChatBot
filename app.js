//Add your requirements
var restify = require('restify');
var builder = require('botbuilder');
var azure = require('botbuilder-azure');
const dotenv = require("dotenv");
dotenv.load();

var documentDbOptions = {
    host: process.env.host, 
    masterKey: process.env.masterKey, 
    database: 'botdocs',   
    collection: 'botdata'
};

var docDbClient = new azure.DocumentDbClient(documentDbOptions);

var cosmosStorage = new azure.AzureBotStorage({ gzipData: false }, docDbClient);

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// Serve a static web page
server.get(/.*/, restify.plugins.serveStatic({
    'directory': '.',
    'default': 'index.html'
}));

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    AppID: process.env.AppID,
    AppPassword: process.env.AppPassword
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

var bot = new builder.UniversalBot(connector).set('storage', cosmosStorage);

// Set up LUIS connection
var model = 'https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/' + process.env.LUISID + '?subscription-key=' + process.env.LUISKEY + '&verbose=true&timezoneOffset=0&q='
var recognizer = new builder.LuisRecognizer(model)
var dialog = new builder.IntentDialog({ recognizers: [recognizer] })

bot.dialog('/', dialog)

dialog.matches('greeting', [
    function (session, results) {
        session.send('Hello!')
    }
])

dialog.matches('farewell', [
    function (session, results) {
        session.send('Bye!')
    }
])

dialog.onDefault([
    function (session, results) {
        session.send("That one didn't work.")
        session.beginDialog('/', results)
    }
])
