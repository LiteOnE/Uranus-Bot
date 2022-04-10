const commands = {
    ['purge', 'pg']: {
        args: [
            {
                name: 'count',
                required: true,
                types: ['number']//snowflake, mention, query
            }
        ],
        desc: 'purge last `n` messages',
        proc: (args) => {

        }
    }
}