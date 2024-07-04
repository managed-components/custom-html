/* If you load an index.html with such a snippet inside:

```
<script src="/some-third-party.js"></script>
<script>
   SomeThirdParty.start()
</script>
```

The browser doesn't execute the second script until the first one is
fully loaded and parsed.

To my best knowledge, this isn't a feature of the DOM, but of the
browser's HTML parser/scanner.

As we're using DOM API to append scripts to the document after it's
been parsed, we no longer have this guarantee, so using the above HTML
snippet in CustomHTML component would result in the second script
running immediately and resulting in an arror, as the first script
didn't load yet.

With this function, we're making the given script only execute once
all the scripts of given IDs have finished loading and running
(onLoad). The handler in index.ts interates over scripts in each HTML
snippet and gives all scripts with an `src` a random ID and attaches
an onload listener that dispatches an event named `loaded-${scriptID}`.

The code that needs to wait for those scripts is then wrapped in
another code that only runs the original code once it register all the
events that signal that the necessary scripts have finished running.

so, for a simple `console.log('hello')` script that needs scripts
"id1" and "id2" to work, we'd get:

```
{
  const loaded = { id1: false, id2: false };
  let called = false;

  const call_if_ready = () => {
    if (!called && Object.values(loaded).every((e) => e)) {
      {
        console.log("hello");
      }
      called = true;
    }
  };

  document.addEventListener("loaded-id1", () => {
    loaded["id1"] = true;
    call_if_ready();
  });
  document.addEventListener("loaded-id2", () => {
    loaded["id2"] = true;
    call_if_ready();
  });
}
```


*/

export function postponeScript(
  idsOfScriptsToAwait: string[],
  script_content: string
) {
  return `{const loaded = ${JSON.stringify(
    Object.fromEntries(idsOfScriptsToAwait.map(id => [id, false]))
  )};
          let called = false;

          const call_if_ready = () => {
               if( !called && Object.values(loaded).every(e => e) ) {
                   {${script_content}};
                   called = true
               }
          };

          ${idsOfScriptsToAwait
            .map(
              id => `document.addEventListener(
                      "loaded-${id}",
                      ()=>{ loaded["${id}"] = true;
                      call_if_ready()
                   })`
            )
            .join(';')}}`
}
