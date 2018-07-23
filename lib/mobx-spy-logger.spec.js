const mobxSpyLogger = require('./mobx-spy-logger')
const mobx = require('mobx')

function noop () {}

// Dummy model with computed property fullName
function Person (id, firstName, lastName) {
  mobx.extendObservable(this, {
    id,
    firstName,
    lastName,
    get fullName () {
      return `${this.firstName} ${this.lastName}`
    },
    setProp: mobx.action('setProp', (prop, value) => {
      this[prop] = value
    })
  })
}

const aPerson = new Person(1, 'John', 'Doe')

// Observing fullName computed property
mobx.autorun(() => aPerson.fullName)

describe('mobxSpyLogger', () => {
  let spyDisposer

  beforeEach(() => {
  })

  afterEach(() => {
    spyDisposer()
  })

  describe('spy options by default', () => {
    it('should log updates, actions and computed with default loggers', () => {
      jest.spyOn(mobxSpyLogger.defaultLoggers, 'logAction')
      jest.spyOn(mobxSpyLogger.defaultLoggers, 'logUpdate')
      jest.spyOn(mobxSpyLogger.defaultLoggers, 'logComputed')
      spyDisposer = mobxSpyLogger.start()
      aPerson.setProp('firstName', 'John' + Math.random())
      expect(mobxSpyLogger.defaultLoggers.logAction).toHaveBeenCalled()
      expect(mobxSpyLogger.defaultLoggers.logUpdate).toHaveBeenCalled()
      expect(mobxSpyLogger.defaultLoggers.logComputed).toHaveBeenCalled()
    })
  })

  describe('using custom printers', () => {
    it('should log updates, actions and computed with custom loggers', () => {
      const options = {
        loggers: {
          logUpdate: jest.fn(),
          logAction: jest.fn(),
          logComputed: jest.fn(),
        }
      }
      spyDisposer = mobxSpyLogger.start(options)
      aPerson.setProp('firstName', 'John' + Math.random())
      expect(options.loggers.logUpdate).toHaveBeenCalled()
      expect(options.loggers.logAction).toHaveBeenCalled()
      expect(options.loggers.logComputed).toHaveBeenCalled()
    })
  })

  describe('default parsers', () => {
    describe('action parser', () => {
      it('should parse an action event', () => {
        const options = {
          loggers: {
            logAction: jest.fn(),
          }
        }
        const newName = 'John' + Math.random()
        const expectedParsedAction = {
          actor: 'Person',
          actorId: '1',
          eventArguments: `("firstName", "${newName}")`,
          actionName: 'setProp',
          isReaction: false
        }
        jest.spyOn(mobxSpyLogger.defaultParsers, 'parseAction')
        spyDisposer = mobxSpyLogger.start(options)
        aPerson.setProp('firstName', newName)
        expect(options.loggers.logAction).toHaveBeenCalledWith(expectedParsedAction)
      })
    })

    describe('update parser', () => {
      it('should parse an update event', () => {
        const options = {
          loggers: {
            logUpdate: jest.fn(),
          }
        }
        const newName = 'John' + Math.random()
        const expectedParsedUpdate = {
          actor: 'Person',
          actorId: '1',
          key: 'firstName',
          newValue: `"${newName}"`,
        }
        jest.spyOn(mobxSpyLogger.defaultParsers, 'parseUpdate')
        spyDisposer = mobxSpyLogger.start(options)
        aPerson.setProp('firstName', newName)
        expect(options.loggers.logUpdate).toHaveBeenCalledWith(expectedParsedUpdate)
      })
    })

    describe('computed parser', () => {
      it('should parse a computed prop event', () => {
        const options = {
          loggers: {
            logComputed: jest.fn(),
          }
        }
        const newName = 'John' + Math.random()
        const expectedParsedComputed = {
          actor: 'Person',
          actorId: '1',
          key: 'fullName',
        }
        jest.spyOn(mobxSpyLogger.defaultParsers, 'parseComputed')
        spyDisposer = mobxSpyLogger.start(options)
        aPerson.setProp('firstName', newName)
        expect(options.loggers.logComputed).toHaveBeenCalledWith(expectedParsedComputed)
      })
    })
  })

  describe('spyActions option', () => {
    it('should not log actions when false', () => {
      const logActionSpy = jest.fn()
      spyDisposer = mobxSpyLogger.start({spyActions: false})
      aPerson.setProp('firstName', 'John' + Math.random())
      expect(logActionSpy).not.toHaveBeenCalled()
    })
  })

  describe('spyUpdates option', () => {
    it('should not log updates when false', () => {
      const logUpdateSpy = jest.fn()
      spyDisposer = mobxSpyLogger.start({spyUpdates: false, loggers: {logAction: noop}})
      aPerson.setProp('firstName', 'John' + Math.random())
      expect(logUpdateSpy).not.toHaveBeenCalled()
    })
  })

  describe('spyComputed option', () => {
    it('should not log computed when false', () => {
      const logComputedSpy = jest.fn()
      spyDisposer = mobxSpyLogger.start({spyComputed: false, loggers: {logAction: noop}})
      aPerson.setProp('firstName', 'John' + Math.random())
      expect(logComputedSpy).not.toHaveBeenCalled()
    })
  })
})
