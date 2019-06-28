const Discord = require('discord.js');
const config = require('./config.json');

const client = new Discord.Client();

var guildMembers = [];//todo: move it somewhere

function commandSplit(command, limit) {//using split splice push would result in losing multiple spaces if any
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

    if (balance != 0) {
        return EValidationStatus.WRONGBALANCE;
    }
    else {
        return EValidationStatus.VALID;
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

client.on('message', message => {

    let message_content = message.content.trim();

    if (message_content.startsWith(config.prefix)) {
        let parts = commandSplit(message_content.substring(config.prefix.length), 2);

        //query processing
        let arg = parts[1];

        let mention_arr = arg.match(/<@!?(\d+)>/);
        let snowflake_arr = arg.match(/^(\d+)$/);

        let userids = [];

        if (mention_arr !== null) {
            userids.push(mention_arr[1]);
        }
        else if (snowflake_arr !== null) {
            userids.push(snowflake_arr[1]);
        } else {
            let query = '';
            if (arg[0] == '`') {
                if (arg[arg.length - 1] == '`') {
                    query = arg.substring(1, arg.length - 1);
                }
                else {
                    //failed initial validation
                    message.channel.send('invalid query');
                }
            }
            else {
                query = arg;
            }

            let validation_status = validateQuery(query);

            if (validation_status & EValidationStatus.VALID == EValidationStatus.VALID) {
                guildMembers = message.guild.members;//todo: use fetchMembers()

                let query_tree = buildQueryTree(query);
                userids = executeQuery(query_tree, null, -1);
            }
            else {
                message.channel.send('invalid query: ' + validation_status)
            }
        }

        switch (parts[0]) {
            case 'q':
                let msg = '';
                for (let id of userids) {
                    msg += `<@${id}> `;
                }

                message.channel.send(userids.length + ' | ' + msg);

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
const EQueryFlags = {
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
            else {
                tag += c;
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
        node.tag = node.tag.toLowerCase();
        node.val = node.val.toLowerCase();

        switch (node.tag) {//todo: add support for flags
            case 'nickname':
            case 'n':
                for (let [, member] of guildMembers) {
                    if (member.nickname.toLowerCase() == node.val) {
                        filtered.push(member.id);
                    }
                }
                break;
            case 'username':
            case 'u':
                for (let [, member] of guildMembers) {
                    if (member.user.username.toLowerCase() == node.val) {
                        filtered.push(member.id);
                    }
                }
                break;
            case 'role':
            case 'r':
                for (let [, member] of guildMembers) {
                    for (let [snowflake, role] of member.roles) {
                        if (role.name.toLowerCase() == node.val) {
                            filtered.push(member.id);
                            break;//if there are identical roles, this will prevent adding a user multiple times if they got them both
                        }
                    }
                }
                break;
            case 'bot':
            case 'b':
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