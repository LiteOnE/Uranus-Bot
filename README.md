# Uranus Discord Bot
![Main Banner](/banner.png)

# Discord Hack Week Bot

Uranus - a simple moderation bot with a unique member search feature - queries

---

## Search query syntax

A query is an expression with boolean operations

The syntax will appear somewhat familiar if you have some experience with programming

It contains of properties, values, flags, operators and brackets

### Properties

- `nickname`
User's nickname on server. If they don't have one, the search will be applied to username
- `username`
User's username
- `role`

- `bot` (in todo)

### Operators

- `|` - Or
- `&` - And

### Flags

- `!` - inversed (Not operation)
- `*` - partial matching
- `?` - case sensitive

### An example command

### `$$ban role!=admin&role!=mod&nickname*=sas`

**Breakdown**

`$$` - Bot's prefix

`ban` - Command to be executed on matched members if any

`role!=admin&role=mod` - Has neither of the roles **Admin** or **Mod**. By default all values are case insensitive, so that will match **ADMIN**, **aDmIn** and etc. You may add supply property with `?` flag to match the case

`nickname*=john` - Has the word **sas** contained in the user's nickname. If they don't have one, then it will be applied to username

So the bot will ban every member that has **sas** in their name, while not having **Admin** or **Mod** role in any capitalization
