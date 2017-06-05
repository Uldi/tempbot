var restify = require('restify');
var builder = require('botbuilder');
var fs = require('fs');
require('dotenv').config();

//eigene Module
var netatmo = require('./modules/netatmo.js')();

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

// Init Bot
var bot = new builder.UniversalBot(connector, {
    localizerSettings: {
        defaultLocale: "de"
    }
});


//=========================================================
// App helper methods
//=========================================================
function RestApiError(code, message) {
    this.name = "RestApiError";
    this.message = "[" + code + "] " + (message || "");
}
RestApiError.prototype = Error.prototype;

function getHttpErrorCode(e) {
    var hasError = /^\[.*\].*$/.test(e.message);
    if (hasError) {
        var myRegexp = /^\[(.*)\].*$/;
        var match = myRegexp.exec(e.message);
        return match[1];
    } else {
        return "500";
    }
}

function handleError(res, e, docs, defaultString) {
    if (e && e.name == "RestApiError") {
        console.log("handle error: e=" + e + ", docs=" + docs + ", str=" + defaultString);
        res.status(getHttpErrorCode(e)).send(e.message);
        res.end();
        //res.render('500', {error: err, stack: err.stack});
        return true;
    } else if (e) {
        console.log("handle error: e=" + e + ", docs=" + docs + ", str=" + defaultString);
        res.status(500).send(e.message);
        res.end();
        return true;
    } else if (!docs && defaultString != undefined) {
        console.log("handle error: e=" + e + ", docs=" + docs + ", str=" + defaultString);
        res.status(404).send(defaultString);
        res.end();
        return true;
    }
    return false;
}

function isEmpty(obj) {
    return obj == undefined || obj.length == 0;
}

server.get('/images/:name', function (req, res, next) {
    var imageName = req.params.name;
    if (isEmpty(imageName)) {
        return handleError(res,
            new RestApiError("400", 'image name must be specified'));
    }
    if (imageName.indexOf("..") >= 0 || imageName.indexOf("/") >= 0) {
        return handleError(res,
            new RestApiError("400", 'invalid image name - only "name.ext" allowed'));
    }
    var ext = imageName.split(".");
    if (ext.length == 0) {
        return handleError(res,
            new RestApiError("400", 'image has not extension'));
    }
    var contents = fs.readFileSync('./images/' + imageName, '');
    res.setHeader('Content-Type', 'image/' + ext[ext.length - 1]);
    res.end(contents);
});

server.get('/', function (req, res, next) {
    var contents = fs.readFileSync('./index.html', 'utf8');
    res.setHeader('content-type', 'text/html');
    res.end(new Buffer(contents));
});

//=========================================================
// default handler
//=========================================================

var introRecognizer = new builder.RegExpRecognizer("Intro", {
    en_us: /^(Intro|intro|Start|start)/i,
    de: /^(Intro|intro|Start|start)/i
});
var helpRecognizer = new builder.RegExpRecognizer("Help", {
    en_us: /^(Help|help)/i,
    de: /^(Hilfe|hilfe)/i
});
var intents = new builder.IntentDialog({
    recognizers: [introRecognizer, helpRecognizer]
});


bot.dialog('/',
    intents
    .matches('Help', '/Help')
    .matches('Testen', '/Testen')
    .matches('Intro', '/Intro')
);

intents.onDefault(
    builder.DialogAction.send("$.Intro.Error")
);


//Intro/Start Dialog
bot.dialog('/Intro', [
  function (session, args, next) {
            session.preferredLocale("de");

            //create buttons
            var stations = netatmo.getStationNames();
            var buttons = [];
            for (i = 0; i < stations.length; i++) {
                buttons[i] =
                    builder.CardAction.imBack(session, "Indoor Temp for " + stations[i], stations[i]);
            }


            var card = new builder.HeroCard(session)
                .title("Tempbot")
                .text("$.Intro.Welcome")
                .images([
                 builder.CardImage.create(session, process.env.BOT_DOMAIN_URL + "/images/tempbot.png")
            ]).buttons(buttons);

            var msg = new builder.Message(session).addAttachment(card);
            session.send(msg).endDialog();

  }
])
    .cancelAction('/IntroCancel', "OK abgebrochen - tippe mit 'start' wenn Du was von mir willst", {
        matches: /(stop|bye|goodbye|abbruch|tschüss)/i
    });



//Outodoor Temp Dialog
bot.dialog('/IndoorTemp', [
  function (session, args, next) {
        var utterance = args.intent.matched.input;
        var location = utterance.substring(16); //x = length of "Indoor Temp for "
        var temp = netatmo.getIndoorTemp(location);
        session.send("Indoor Temperature for %s is %s", location, temp);
  }
]).triggerAction({
    matches: /Indoor Temp/i
});


//Hilfe Dialog
bot.dialog('/Help', [
  function (session, args, next) {
        session.send("Help - Help");
  }
]).cancelAction('/HelpCancel', "OK abgebrochen - tippe mit 'start' wenn Du was von mir willst", {
    matches: /(stop|bye|goodbye|abbruch|tschüss)/i
});