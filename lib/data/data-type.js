module.exports = {
  // FINALITY: 'FINALITY',
  BREAK: 'BREAK',         // data cannot processed further, e.g.
                          // $a.b().c
                          // ------^ BREAK
  LITERAL: 'LITERAL',
  FUNCTION: 'FUNCTION',
  ARRAY: 'ARRAY',
  OBJECT: 'OBJECT',
  UNCERTAIN: 'UNCERTAIN'  // undefined or empty string
}
