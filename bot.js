const Discord = require('discord.js');
const config = require('./config.json');//{token, prefix}

const client = new Discord.Client();

var guildMembers = [];//todo: move it somewhere
var guildRoles = []; //this too

function commandSplit(command, limit) {//using split splice push would result in losing multiple spaces if any
    if (limit < 2) {
        return command;
    }

    let result = [];
    let length = 0;

    let str = '';

    for (var i = 0; i < command.length; i += 1) {
        if (command[i] == ' ' && str != '') {//todo: add isLongArgument var that signals that arg may contain spaces like `query`
            result.push(str);
            length += 1;
            str = '';

            while (command[i += 1] == ' ') { }

            if (length == limit - 1) {//leave 1 for the last element
                break;
            }
            else {
                i -= 1;
            }
        }
        else {
            str += command[i];
        }
    }

    if (str != '') {
        result.push(str);
    }
    else {
        for (; i < command.length; i += 1) {
            str += command[i];
        }

        result.push(str);
    }

    return result;
}

function isLetter(str) {
    return str.length === 1 && str.match(/[a-z]/i);
}

const EValidationStatus = {
    INVALID: 0,//0
    VALID: 1,//1
    WRONGBALANCE: 1 << 1,//2
    INVALIDOPERATOR: 1 << 2,//4
    UNKNOWNFLAG: 1 << 3,//8
    NULLVALUE: 1 << 4,//16
    NULLTAG: 1 << 5,//32
}

function validateQuery(query_str) {
    query_str = query_str.toLowerCase();

    //let result_flags = 0;

    let is_tag = true;
    let tag = '';
    let val = '';
    let balance = 0;


    for (let i = 0; i < query_str.length; i += 1) {
        let c = query_str[i];

        if (c == '(') {
            balance += 1;
        }
        else if (c == ')') {
            balance -= 1;
        }
        else {
            if (is_tag) {
                if (!isLetter(c)) {
                    if (tag.length == 0) {
                        return EValidationStatus.NULLTAG;
                    }
                    else {
                        if (c == '=') {
                            if (query_str[i + 1] === undefined) {
                                return EValidationStatus.NULLVALUE;
                            }

                            tag = '';
                            is_tag = false;
                        }
                        else if (c != '?' && c != '!' && c != '*') {
                            return EValidationStatus.UNKNOWNFLAG;
                        }
                    }
                }
                else {
                    tag += c;
                }
            }
            else {//value
                if (c == '&' || c == '|') {
                    if (val.length == 0) {
                        return EValidationStatus.NULLVALUE;
                    }

                    if (/*query_str[i + 1] !== undefined && !isLetter(query_str[i + 1]) ||*/
                        query_str[i + 1] === undefined) {
                        return EValidationStatus.INVALIDOPERATOR;
                    }
                    else {
                        val = '';
                        is_tag = true;
                    }
                }
                else {
                    val += c;
                }
            }
        }
    }

    if (tag.length != 0) {
        return EValidationStatus.INVALID;
    }

    if (balance == 0) {
        return EValidationStatus.VALID;
    }
    /*
    else if (balance > 0) {//todo: unclosed brackets should be ok
        return EValidationStatus.WRONGBALANCE | EValidationStatus.VALID;
    }*/
    else {
        return EValidationStatus.WRONGBALANCE;
    }
}

/*
console.log(validateQuery('das'));
return;
*/

client.on('ready', () => {
    console.log('I am ready!');
    client.user.setActivity('', { type: 'WATCHING' });
});

const CommandsList = {
    'q': [2, '(query/@mention/snowflake)'],//required args,  help str 
    'kick': [2, '(query/@mention/snowflake) [reason]', 3],
    'k': [2, '(query/@mention/snowflake) [reason]', 3],
    'ban': [2, '(query/@mention/snowflake) [reason]', 3],
    'b': [2, '(query/@mention/snowflake) [reason]', 3],
    'unban': [2, '(@mention/snowflake)'],//accepts only mention or snowflake
    'addrole': [3, '(query/@mention/snowflake) (@role/snowflake)'],//+role
    'ar': [3, '(query/@mention/snowflake) (@role/snowflake)'],
    'removerole': [3, '(query/@mention/snowflake) (@role/snowflake)'],//+role
    'rr': [3, '(query/@mention/snowflake) (@role/snowflake)'],
    'help': [1, ''],
    'h': [1, ''],
    'warn': [2, '(query/@mention/snowflake) [message]', 3],//+message
    'w': [2, '(query/@mention/snowflake) [message]', 3],
    'resetnickname': [2, '(query/@mention/snowflake)'],
    'rn': [2, '(query/@mention/snowflake)'],
}

client.on('message', message => {

    let message_content = message.content.trim();

    if (message_content.startsWith(config.prefix)) {
        message_content = message_content.substring(config.prefix.length);

        let command_arr = commandSplit(message_content, 2);
        let command = command_arr[0];

        let command_data = CommandsList[command];

        if (command_data !== undefined) {
            command_arr = commandSplit(message_content, command_data[2] || command_data[0]);

            if (command_arr.length < command_data[0]) {
                message.channel.send('Wrong arguments!\nUsage: `' + command + ' ' + command_data[1] + '`');
                return;
            }
        }
        else {
            message.channel.send('Unknown command .-.');
            return;
        }

        let userids = [];

        if (command_data[0] > 1) {
            let arg0 = command_arr[1];

            let mention_or_snowflake_arr = arg0.match(/<@!?(\d+)>|^(\d+)$/);//use /<@!?(\d+)>|^(\d+)$/
            if (mention_or_snowflake_arr !== null) {
                userids.push(mention_or_snowflake_arr[1] || mention_or_snowflake_arr[2]);
            }
            else {
                let query = '';
                if (arg0[0] == '`') {
                    if (arg0[arg0.length - 1] == '`') {
                        query = arg0.substring(1, arg0.length - 1);
                    }
                    else {
                        //failed initial validation
                        message.channel.send('invalid query');
                    }
                }
                else {
                    query = arg0;
                }

                let validation_status = validateQuery(query);

                if (validation_status & EValidationStatus.VALID == EValidationStatus.VALID) {
                    guildMembers = message.guild.members;//todo: use fetchMembers()
                    guildRoles = message.guild.roles;

                    let query_tree = buildQueryTree(query);
                    userids = executeQuery(query_tree, null, -1);
                }
                else {
                    message.channel.send('invalid query: ' + validation_status)
                }
            }
        }

        switch (command) {
            case 'q':
                let msg = '';
                for (let id of userids) {
                    msg += `<@${id}> `;
                }

                message.channel.send(userids.length + ' | ' + msg);
                break;

            case 'kick'://add reason
            case 'k':
                for (let id of userids) {
                    client.fetchUser(id.toString()).then(user_obj => {
                        message.guild.member(user_obj).kick();
                    }).catch(err => { console.log(err); });
                }

                message.channel.send('Kicked ' + userids.length + ' members');
                break;

            case 'ban'://add reason
            case 'b':
                for (let id of userids) {
                    client.fetchUser(id.toString()).then(user_obj => {
                        message.guild.member(user_obj).ban();
                    }).catch(err => { console.log(err); });
                }

                message.channel.send('Banned ' + userids.length + ' members');
                break;

            case 'unban':
                message.channel.send('Unimplemented!');
                break;

            case 'unkick':
                message.channel.send('I told you, there is no such command!');
                break;

            case 'addrole':
            case 'ar':

                var arg1 = command_arr[2];

                var role_arr = arg1.match(/<@&(\d+)>|^(\d+)&/);

                if (role_arr === null) {
                    message.channel.send('Invalid args!');
                }

                var role = role_arr[1] || role_arr[2];

                for (let id of userids) {
                    client.fetchUser(id.toString()).then(user_obj => {
                        message.guild.member(user_obj).addRole(role.toString());
                    }).catch(err => { console.log(err); });
                }

                message.channel.send('Role added to ' + userids.length + ' members');


                break;

            case 'removerole':
            case 'rr':
                var arg1 = command_arr[2];

                var role_arr = arg1.match(/<@&(\d+)>|^(\d+)&/);

                if (role_arr === null) {
                    message.channel.send('Invalid args!');
                }

                var role = role_arr[1] || role_arr[2];

                for (let id of userids) {
                    client.fetchUser(id.toString()).then(user_obj => {
                        message.guild.member(user_obj).removeRole(role.toString());
                    }).catch(err => { console.log(err); });
                }

                message.channel.send('Role removed from ' + userids.length + ' members');

                break;

            case 'help':
            case 'h':
                let help_msg = '```\n';

                for (let com in CommandsList) {
                    help_msg += com + ' ' + CommandsList[com][1] + '\n';
                }

                help_msg += '```';

                message.channel.send(help_msg);

                break;

            case 'warn':
            case 'w':

                let warn_msg = 'You have been warned on ' + message.guild.name + '\n\n';

                warn_msg += command_arr[2] || '';

                for (let id of userids) {
                    client.fetchUser(id.toString()).then(user_obj => {
                        message.guild.member(user_obj).createDM().then(dmchannel => {
                            dmchannel.send(warn_msg);
                        }).catch(err => console.log(err));
                    }).catch(err => { console.log(err); });
                }

                message.channel.send('Warned ' + userids.length + ' members');
                break;

                break;

            case 'resetnickname':
            case 'rn':
                for (let id of userids) {
                    client.fetchUser(id.toString()).then(user_obj => {
                        message.guild.member(user_obj).setNickname('').then(() => {
                            message.channel.send('Nicknames reset of ' + userids.length + ' members');
                        }).catch(err => {
                            message.channel.send('No permissions to change nicknames!');
                        });
                    }).catch(err => { console.log(err); });
                }

                break;

            default:
                break;
        }
    }

    if (message.content === 'exit') {
        if (message.author.id == '224099990455189504') {
            message.channel.send('k');

            client.destroy().then(() => {
                console.log('logged off...');
            });
        }
    }

});

/*
var guildMembers = [
    {
        'username': 'sas',
        'nickname': 'bob',
        'role': 'test'
    },
    {
        'username': 'bab',
        'nickname': 'sos',
        'role': 'best'
    },
    {
        'username': 'bab',
        'nickname': 'sos',
        'role': 'vev'
    }
    ,
    {
        'username': 'sos',
        'nickname': 'sos',
        'role': 'test'
    }
    ,
    {
        'username': 'sxs',
        'nickname': 'sos',
        'role': 'bobs'
    }
    ,
    {
        'username': 'bab',
        'nickname': 'ses',
        'role': 'vev'
    }
];

var query1 = 'username=sas';
var query2 = 'username=bab&role=vev';
var query3 = '(username=sas|username=sos)|(role=bobs|role=vev)&(nickname=sos|nickname=ses)';//u  - username, n - nickname, r = role
var query4 = 'role=vev&username=bab|username=sas&nickname=bob';
*/
const EFilterFlags = {
    NONE: 0,
    INVERTED: 1 << 0,
    PARTIAL: 1 << 1,
    CASESENSITIVE: 1 << 2
}

class Node {
    constructor(tag = null, val = null, operator = 0) {
        this.tag = tag;
        this.val = val;
        this.operator = operator;

        this.flags = 0;

        this.low = null;
        this.high = null;
        this.next = null;
    }
}

function buildQueryTree(query) {//high is not needed
    var tag = '';
    var val = '';

    var is_tag = true;

    var root_node = new Node();
    var cur = root_node;

    var balance = 0;

    for (let i = 0; i < query.length; i += 1) {
        let c = query[i];

        if (c == '(') {
            balance += 1;

            //higher (technically lower) priority
            cur.low = new Node();
            cur.low.high = cur;

            cur = cur.low;

            continue;
        }

        if (c == ')') {
            balance -= 1;

            cur.tag = tag;
            cur.val = val;
            cur.operator = 0;

            tag = '';
            val = '';

            is_tag = true;

            //skip for multiple closing brackets
            while (query[i] == ')') {
                cur = cur.high;
                i += 1;
            }

            if (i < query.length) {
                c = query[i];

                if (c == '&') {
                    //push double priority for brackets and AND operator
                    let low2 = cur.low;

                    cur.low = new Node();
                    cur.low.high = cur;

                    cur = cur.low;
                    cur.low = low2;
                    cur.low.high = cur;

                    let cur2 = cur.low;

                    while (cur2.next != null) {
                        cur2 = cur2.next;
                    }

                    cur2.high = cur;

                    cur.operator = c;
                }
                else if (c == '|') {
                    cur.operator = c;
                }

                cur.next = new Node();
                cur.next.high = cur.high;
                cur = cur.next;
            }

            continue;
        }

        if (is_tag) {
            if (c == '=') {
                is_tag = false;
                continue;
            }
            else if (isLetter(c)) {
                tag += c;
            }
            else {
                switch (c) {
                    case '!':
                        cur.flags |= EFilterFlags.INVERTED;
                        break;

                    case '?':
                        cur.flags |= EFilterFlags.CASESENSITIVE;
                        break;

                    case '*':
                        cur.flags |= EFilterFlags.PARTIAL;
                        break;

                    default:
                        break;
                }
            }

        }
        else {//value
            if (c == '&') {
                cur.low = new Node(tag, val, c);
                cur.low.high = cur;

                cur = cur.low;
                cur.next = new Node();
                cur.next.high = cur.high;
                cur = cur.next;

                tag = '';
                val = '';

                is_tag = true;
            }
            else if (c == '|') {
                cur.tag = tag;
                cur.val = val;
                cur.operator = c;

                cur.next = new Node();
                cur.next.high = cur.high;
                cur = cur.next;

                tag = '';
                val = '';

                is_tag = true;
            }
            else {
                val += c;
            }
        }
    }

    cur.tag = tag || null;
    cur.val = val || null;
    cur.operator = 0;

    //cur = root_node;

    return root_node;
}

function executeQuery(node, filtered_prev, operator) {

    var filtered = [];

    if (node.low != null) {
        filtered = executeQuery(node.low, null, -1);
    }
    else {
        if (node.flags & EFilterFlags.CASESENSITIVE == 0) {
            node.tag = node.tag.toLowerCase();
            node.val = node.val.toLowerCase();
        }

        switch (node.tag) {
            case 'nickname':
            case 'n':
                for (let [, member] of guildMembers) {
                    let property_val = member.nickname;

                    if (property_val === null) {//no nickname, switch to username
                        property_val = member.user.username;
                    }

                    property_val =
                        ((node.flags & EFilterFlags.CASESENSITIVE) == EFilterFlags.CASESENSITIVE)
                            ? property_val
                            : property_val.toLowerCase();

                    if (
                        ((node.flags & EFilterFlags.INVERTED) == EFilterFlags.INVERTED)
                        ^
                        (
                            ((node.flags & EFilterFlags.PARTIAL) == EFilterFlags.PARTIAL)
                                ?
                                property_val.includes(node.val)
                                :
                                property_val == node.val
                        )
                    ) { filtered.push(member.id); }
                }
                break;
            case 'username':
            case 'u':
                for (let [, member] of guildMembers) {
                    let property_val = member.user.username;

                    property_val =
                        ((node.flags & EFilterFlags.CASESENSITIVE) == EFilterFlags.CASESENSITIVE)
                            ? property_val
                            : property_val.toLowerCase();

                    if (
                        ((node.flags & EFilterFlags.INVERTED) == EFilterFlags.INVERTED)
                        ^
                        (
                            ((node.flags & EFilterFlags.PARTIAL) == EFilterFlags.PARTIAL)
                                ?
                                property_val.includes(node.val)
                                :
                                property_val == node.val
                        )
                    ) { filtered.push(member.id); }
                }
                break;
            case 'role':
            case 'r':
                let matchedRoles = [];

                if ((node.flags & EFilterFlags.INVERTED) == EFilterFlags.INVERTED) {
                    for (let [, member] of guildMembers) {
                        let hasRole = false;

                        for (let [, role] of member.roles) {
                            let property_val = role.name;

                            property_val =
                                ((node.flags & EFilterFlags.CASESENSITIVE) == EFilterFlags.CASESENSITIVE)
                                    ? property_val
                                    : property_val.toLowerCase();

                            if (
                                ((node.flags & EFilterFlags.PARTIAL) == EFilterFlags.PARTIAL)
                                    ?
                                    property_val.includes(node.val)
                                    :
                                    property_val == node.val
                            ) {
                                hasRole = true;
                                break;
                            }
                        }

                        if (!hasRole) {
                            filtered.push(member.id);
                        }
                    }
                }
                else {
                    for (let [, role] of guildRoles) {
                        let property_val = role.name;

                        property_val =
                            ((node.flags & EFilterFlags.CASESENSITIVE) == EFilterFlags.CASESENSITIVE)
                                ? property_val
                                : property_val.toLowerCase();

                        if (
                            ((node.flags & EFilterFlags.PARTIAL) == EFilterFlags.PARTIAL)
                                ?
                                property_val.includes(node.val)
                                :
                                property_val == node.val
                        ) {
                            matchedRoles.push(role);
                        }
                    }

                    for (let role of matchedRoles) {
                        for (let [, member] of role.members) {
                            if (!filtered.includes(member.id)) {
                                filtered.push(member.id);
                            }
                        }
                    }
                }
                break;
            case 'bot':
            case 'b':
                for (let [, member] of guildMembers) {
                    if (!(member.user.bot ^ node.val)) {
                        filtered.push(member.id);
                    }
                }
                break;
            default:
                break;
        }
    }

    switch (operator) {
        case '|':
            for (let item of filtered_prev) {
                if (!filtered.includes(item)) {
                    filtered.push(item);
                }
            }
            break;

        case '&':
            var result_query = [];

            for (let item of filtered_prev) {
                if (filtered.includes(item)) {
                    result_query.push(item);
                }
            }

            filtered = result_query;

            break;
    }

    if (node.next != null) {
        return executeQuery(node.next, filtered, node.operator);
    }
    else {
        return filtered;
    }
}


client.login(config.token);
//console.log(executeQuery(root_node, null, -1));