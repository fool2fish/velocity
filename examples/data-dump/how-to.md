# data dump

1. run `$ velocity` at current dir.

2. replace content of velocity-config.js with

    ```
    module.exports = {
      template: './data-dump.vm',
      context: './context.js',
      output:'./context-dump.js'
    }
    ```

3. run `$ velocity` again.

Now you get the context file **./context-dump.js** from the runtime.