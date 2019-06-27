# Discord Hack Week Bot 2019

![Main Banner](/banner.png)

# Uranus Discord Bot

Uranus - a simple moderation bot with a unique member search feature - queries

---

## Search query syntax

A query is an expression with boolean operations

The syntax will appear somewhat familiar if you have some experience with programming

It contains of properties, values, flags, operators and brackets

### Properties

- `nickname` - Looks at user's nickname on server. If they don't have one, the search will be applied to username
- `username` - User's username
- `role` - Role applied to user on server
- `bot` - Whether or not member is a bot

### Operators

- `|` - Or
- `&` - And

```
Keep in mind that boolean rules work here and '&' will be executed the first and then '|'
But if you don't want that, you may use brackets
```

### Brackets

- `(` - Opening bracket
- `)` - Closing bracket

```
You can use brackets to define execution order
For example a|b&c - b&c will be executed the first and only then a|
But you may want to execute a|b the first, so you need to use brackets like this: (a|b)&c
```

### Flags

- `!` - inversed (Not operation)
- `*` - partial matching
- `?` - case sensitive

```
The flags should be entered after property name and before '=' sign,
which is used to split property name with flags from value to search
```


### An example command

### `$$ban role!=admin&role!=mod&nickname*=sas`

**Breakdown**

`$$` - Bot's prefix

`ban` - Command to be executed on matched members if any

`role!=admin&role=mod` - Has neither of the roles **Admin** or **Mod**. By default all values are case insensitive, so that will match **ADMIN**, **aDmIn** and etc. You may add supply property with `?` flag to match the case

`nickname*=john` - Has the word **sas** contained in the user's nickname. If they don't have one, then it will be applied to username

So the bot will ban every member that has **sas** in their name, while not having **Admin** or **Mod** role in any capitalization
