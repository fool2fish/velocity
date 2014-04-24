module.exports = {
  DEFINE: 'DEFINE',
  BREAK: 'BREAK',         // data cannot processed further, e.g.
                          // $a.b().c
                          // ------^ BREAK
  LITERAL: 'LITERAL',
  FUNCTION: 'FUNCTION',
  ARRAY: 'ARRAY',
  OBJECT: 'OBJECT',
  UNCERTAIN: 'UNCERTAIN'
}
