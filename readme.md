# zenStream

## An usable File Stream Server using Deno!

### Zen Config JSON file
This file is used to simplify zenStream Server usage

Example1: Files stored in the Working Directory
```JSON
{
    "port":2630,
    "root":"/public",
    "externalPath":false,
    "hostname":"127.0.0.1"
}
```

Explanation:
- port -- used to set portnumber
- root -- the file directory you need to serve from
- externalPath -- this flag sets if Deno should Serve files from it's Current Working Directory or from an external Path
- hostname -- the hostname for the server

Example 2: An External File Path

```JSON
{
    "port":2630,
    "root":"/Videos/",
    "externalPath":true,
    "DRIVE_LETTER":"E",
    "hostname":"127.0.0.1"
}
```
Explanation:
- externalPath is set to `true` here, which means Deno will now assume the files are not stored in the Current Working Directory.
- root -- the root in this config is set from the very root of the external path, as in the `DRIVE_LETTER` defines the HardDrive (or partition) and `root` is the address from there.
- here `root` is set to be `"/Videos/"` and `DRIVE_LETTER` is set to be `"E"`, which means the path from deno will serve the files will be `"E:/Videos/"`
