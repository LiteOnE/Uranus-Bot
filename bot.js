const Discord = require('discord.js');
const config = require('./config.json');

const client = new Discord.Client();

client.on('ready', () => {
    console.log('I am ready!');
    client.user.setActivity('YOU', { type: "LISTENING" });
});

client.on('message', message => {
    if (message.author.id == '396787552775831552') {
        message.channel.send('shut up biba');
    }

    if (message.content.startsWith('f')) {
        var sas = message.content.split(' ')[1];
        /*
                var str = '';
        
                for (var [snowflake, member] of message.guild.members) {
                    str += (member.nickname || '') + '|' + member.user.username + '\n';
                }
        
                message.channel.send(str);
                */
        message.channel.send('\\' + sas);
    }

    if (message.content === 'ping') {
        message.channel.send('pong');
    }

    if (message.content === 'exit') {
        if (message.author.id == '396787552775831552') {
            message.channel.send('no exit this time! yo toped ass mafaq');
        }
        else {
            message.channel.send('k');

            client.destroy().then(() => {
                console.log('logged off...');
            });
        }
    }


});

//client.login(config.token);

var test_users = [
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

var query = '(username=sas|username=sos)|(role=test|role=best)&(nickname=ses|nickname=beb)';//u  - username, n - nickname, r = role
var query2 = 'username=sas|nickname=sos&role=test|user=bob';

class Node {
    constructor(tag = null, val = null, operator = 0) {
        this.tag = tag;
        this.val = val;
        this.operator = operator;

        this.low = null;
        this.high = null;
        this.next = null;
    }
}

var tag = '';
var val = '';

var is_tag = true;

var root = new Node();
var cur = root;

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

    if (c == '=') {
        is_tag = false;
        continue;
    }

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
        if (is_tag) {
            tag += c;
        }
        else {
            val += c;
        }
    }
}

cur.tag = tag || null;
cur.val = val || null;
cur.operator = 0;

cur = root;
var results = [];
var result_pos = 0;
var operator = -1;//-1 means start operator

while (cur != null) {
    while (cur.low != null) {
        cur = cur.low;
    }

    var filtered = [];

    //execute
    for (let user of test_users) {
        if (user[cur.tag] == user[cur.val]) {//todo: add support for flags
            filtered.push(user);
        }
    }

    results.push(filtered);
    result_pos += 1;

    if (operator != -1) {
        switch (operator) {
            case '|':
                for (let item of results[result_pos]) {
                    if (!results[result_pos - 1].includes(item)) {
                        results[result_pos - 1].push(item);
                    }
                }
                break;

            case '&':
                let temp_arr = [];

                for (let item of results[result_pos]) {
                    if (results[result_pos - 1].includes(item)) {
                        temp_arr.push(item);
                    }
                }

                results[result_pos] = temp_arr;

                break;
        }
    }


    //save operator
    operator = cur.operator;

    if (cur.next != null) {
        cur = cur.next;
    }
    else {
        if (cur.high != null) {
            //move result to top
            cur = cur.high;

            //execute

            cur = cur.next;
        }
        else {
            //exexute, exit
        }
    }
}


console.log(root);