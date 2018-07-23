const _ = require('lodash')
const mobx = require('mobx')

const actionStyle = {
  prefix: 'font-weight: bold;',
  actor: '',
  actorId: 'color: purple; font-style: italic;',
  actionName: 'font-weight: bold;',
  eventArguments: 'color: blue;',
}

const updateStyle = {
  prefix: 'font-weight: bold;',
  actor: '',
  actorId: 'color: purple; font-style: italic;',
  key: 'font-weight: bold;',
  newValue: 'color: green;',
}

const computedStyle = {
  prefix: 'font-weight: bold',
  actor: '',
  actorId: 'color: purple; font-style: italic;',
  key: 'font-weight: bold;',
}

/**
 * Produce a string representation of a variable depending on its type.
 * @param {*} arg
 */
function argToString (arg) {
  if (_.isString(arg)) {
    return `"${arg}"`
  }
  if (!_.isObject(arg)) {
    return String(arg)
  }
  if (_.isArray(arg)) {
    return `Array[${arg.length}]`
  }
  if (_.isPlainObject(arg)) {
    const keys = _.keys(arg).map((key) => {
      return _.isArray(arg[key]) ? `${key}[${arg[key].length}]` : key
    })
    return `{${keys.join(', ')}}`
  }
  const constructorName = _.get(arg, 'constructor.name')

  if (constructorName) {
    if (constructorName === 'Reaction') {
      return `${arg.observing.map((prop) => prop.name).join(', ')}`
    }
    return constructorName
  }

  return '[Object]'
}

function guessActorId (event) {
  return '' + (_.get(event, 'object.name') || _.get(event, 'object.label') || _.get(event, 'object.id') || '')
}

function guessObjectId (obj) {
  return '' + (_.get(obj, 'name') || _.get(obj, 'label') || _.get(obj, 'id') || _.get(obj, '_id') || '')
}

/**
 * To be able to parse mobx names like: MyStoreName@22.someProperty
 */
const eventNameRegex = /^(.+)@(.+)\.(.+)$/

/**
 * Reaction case is a bit special. This will try to guess why it happened and set it as actor.
 * @param {Object} event
 */
function parseReactionActor () {
  // const [, reaction] = event.arguments
  // if (reaction.observing.length === 1) {
  //   const [fullMatch, actor, mobxId] = eventNameRegex.exec(reaction.observing[0].name)

  //   if (fullMatch) {
  //     return `${actor}@${mobxId}`
  //   }
  // }
  return 'Reaction'
}

/**
 * Extract relevant information from an action event.
 * @param {*} event
 * @returns {Object} {actor, actorId, actionName, eventArguments}
 */
function parseAction (event) {
  const isReaction = _.get(event, 'arguments[1].constructor.name') === 'Reaction'

  let actor = ''
  let actorId = ''
  let actionName = ''
  let eventArguments = ''

  // ACTOR
  if (event.object) {
    let storeName = _.get(event.object, 'constructor.name', '')
    if (storeName) {
      actor += storeName
    }
  }
  else if (isReaction) {
    actor += parseReactionActor(event)
  }
  else {
    actor += `?`
  }

  // ACTOR ID
  actorId += guessActorId(event)

  // EVENT NAME
  actionName += event.name

  // EVENT ARGUMENTS
  if (event.arguments) {
    let args = _.map(event.arguments, (arg) => argToString(arg, event))
    eventArguments += `(${args.join(', ')})`
  }
  else {
    eventArguments += '()'
  }

  return {actor, actorId, actionName, eventArguments, isReaction}
}

/**
 * Default print function for an action event
 * @param {Object} parsedAction
 */
function logAction (parsedAction) {
  const {actor, actorId, actionName, eventArguments, isReaction} = parsedAction
  const prefix = isReaction ? '[R]' : '[@]'
  const _actorId = actorId ? `#${actorId}` : ''
  const eventLog = `%c${prefix} %c${actor}%c${_actorId}%c.${actionName}%c${eventArguments}`
  console.log(eventLog, actionStyle.prefix, actionStyle.actor, actionStyle.actorId, actionStyle.actionName, actionStyle.eventArguments)
}

/**
 * Extract relevant information from the update event.
 * @param {Object} event
 * @returns {Object} {actor, actorId, key, newValue}
 */
function parseUpdate (event) {
  const actor = `${_.get(event, 'object.constructor.name', '?')}`
  let actorId = ''
  const uniqueId = guessActorId(event)
  if (uniqueId) {
    actorId += uniqueId
  }
  const key = event.key
  let newValue = `${argToString(event.newValue, event)}`
  if (_.isObject(event.newValue)) {
    let uniqueId = guessObjectId(event.newValue)
    if (uniqueId) {
      newValue += `#${uniqueId}`
    }
  }
  return {actor, actorId, key, newValue}
}

/**
 * Log parsed update event
 * @param {Object} parsedUpdated
 */
function logUpdate (parsedUpdate) {
  let prefix = '[U]'
  const {actor, actorId, key, newValue} = parsedUpdate
  const _actorId = actorId ? `#${actorId}` : ''
  const eventLog = `%c${prefix} %c${actor}%c${_actorId}%c.${key} = %c${newValue}`
  console.log(eventLog, updateStyle.prefix, updateStyle.actor, updateStyle.actorId, updateStyle.key, updateStyle.newValue)
}

/**
 * @param {object} event
 * @returns {object} {actor, actorId, key}
 */
function parseComputed (event) {
  let actorId = ''
  const [, actor, mobxId, key] = eventNameRegex.exec(event.name)
  const uniqueId = guessActorId(event)
  actorId += uniqueId || mobxId
  return {actor, actorId, key}
}

/**
 * Log parsed computed event
 * @param {Object} parsedComputed
 */
function logComputed (parsedComputed) {
  let prefix = '[C]'
  const {actor, actorId, key} = parsedComputed
  const _actorId = actorId ? `#${actorId}` : ''
  const eventLog = `%c${prefix} %c${actor}%c${_actorId}.%c${key}`
  console.log(eventLog, computedStyle.prefix, computedStyle.actor, computedStyle.actorId, computedStyle.key)
}

const defaultParsers = {
  parseAction,
  parseUpdate,
  parseComputed
}

const defaultLoggers = {
  logAction,
  logUpdate,
  logComputed,
}

/**
 * @typedef loggerOptions
 * @type {object}
 * @property {function} logAction - called with {actor, actorId, actionName, eventArguments, isReaction}
 * @property {function} logUpdate - called with {actor, actorId, key, newValue}
 * @property {function} logComputed - called with {actor, actorId, key}
 */

/**
 * @typedef spyOptions
 * @type {object}
 * @property {boolean} spyActions
 * @property {boolean} spyUpdates
 * @property {boolean} spyComputed
 * @property {loggerOptions} loggers
 */

/**
 * Start logging.
 * @param {spyOptions} options
 * @returns {function} spyDisposer - function to remove the spy listener
 */
function start ({spyActions = true, spyUpdates = true, spyComputed = true, loggers = {}} = {}) {
  const logAction = loggers.logAction || defaultLoggers.logAction
  const logUpdate = loggers.logUpdate || defaultLoggers.logUpdate
  const logComputed = loggers.logComputed || defaultLoggers.logComputed

  return mobx.spy((event) => {
    if (spyActions && event.type === 'action') {
      const parsed = defaultParsers.parseAction(event)
      logAction(parsed)
    }

    else if (spyUpdates && event.type === 'update') {
      const parsed = defaultParsers.parseUpdate(event)
      logUpdate(parsed)
    }

    else if (spyComputed && event.type === 'compute') {
      const parsed = defaultParsers.parseComputed(event)
      logComputed(parsed)
    }
  })
}

module.exports = {
  defaultParsers,
  defaultLoggers,
  start
}
