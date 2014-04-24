module.exports = {
  LEFT: 'LEFT',
  BREAK: 'BREAK',
  DEFINE: 'DEFINE',
  CERTAIN: 'CERTAIN',
  UNCERTAIN: 'UNCERTAIN'
}


/*
 * Intermediate Data Structure
 *
 * {
 *   // left hand of assignment expression
 *   //
 *   // why .__origin?
 *   // consider code: $a.b #set($a=1)
 *   //
 *   // $a.b #set($a=1)
 *   //           ^^
 *   // data info of $a.b will be covered now
 *   // so .__origin used to store it for final result
 *   a: {
 *     __stats: LEFT,
 *     __value: pointer to other data || { __stats: BREAK },
 *     __origin: optional
 *   },
 *
 *   // data that cannot go further, e.g. integer, return of function
 *   b: {
 *     __stats: BREAK
 *   },
 *
 *   // define
 *   // for simplicity, define is processed when defined
 *   // when is is called, we do nothing
 *   c: {
 *     __stats: DEFINE,
 *     __origin: optional
 *   },
 *
 *   d: {
 *     __stats: CERTAIN,
 *     __value: value
 *   },
 *
 *   // reference that must exists but cannot decide the data type yet
 *   // e.g.
 *   // $a.b
 *   //  ^ $a is uncertain
 *   // $a.b
 *   //    ^ $a is a certain object, $a.b is uncertain
 *   //
 *   // why uncertain reference may has a .__value ?
 *   // consider: $a.b[$c]
 *   // because we cannot know $c is an integer or a string
 *   // so $a.b may be a list or a map, we default set it as a list
 *   e: {
 *     __stats: UNCERTAIN,
 *     __value: optional
 *   }
 * }
 */