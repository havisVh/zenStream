const decoder = new TextDecoder('utf-8');
const configData = Deno.readFileSync('./zenconfig.json');
const config = JSON.parse(decoder.decode(configData));

export { config };