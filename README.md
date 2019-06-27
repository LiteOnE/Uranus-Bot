# Uranus Discord Bot
![Main Banner](/banner.png)

# Discord Hack Week Bot

Uranus - a simple moderation bot with a unique member search feature - queries

---

## Search query syntax

A query is an expression with boolean operations

The syntax will appear somewhat familiar if you have some experience with programming

### Properties

- `nickname`
- `username`
- `role`
- `bot` (in todo)

### Operators

- `|` - Or
- `&` - And

### Flags

- `!` - inversed (Not operation)
- `*` - partial matching
- `?` - case sensitive

### An example query

### `(role!=admin&role!=mod&nickname*=john)`

**Breakdown**

`role!=admin&role=mod` - Has neither of the roles **Admin** or **Mod**. By default all values are case insensitive, so that will match **ADMIN**, **aDmIn** and etc. You may add supply property with `?` flag to match the case

`nickname*=john` - Has the word **john** contained in the user's nickname. If they don't have one, then it will be applied to username
