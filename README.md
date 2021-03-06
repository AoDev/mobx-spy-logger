# mobx-spy-logger
**Easy to read, customisable mobx events logger based on mobx.spy.**

This module extracts relevant data from mobx spy events and "pretty prints" them.  
A particular feature is that it tries to guess `ids` from your observables to easily filter
the changes you are interested in. You can also provide your own loggers if necessary :)


<img align="center" src="https://github.com/AoDev/mobx-spy-logger/blob/master/docs/images/mobx-spy-logger-cryptovista-screencast.gif" width="640" alt="mobx spy logger in action screencast"/>

## Requirements

This lib has peer dependencies:
* `mobx`
* `lodash` (I'll try to remove it if it's a problem)

## Install

```
npm install mobx-spy-logger -DE
```

## Usage
The logger has "sane" defaults, for a quick start, you just need two lines of code:

```javascript
import mobxSpyLogger from 'mobx-spy-logger'
mobxSpyLogger.start()
```

mobxSpyLogger.start() returns a mobx dispose function. You can stop logging this way if needed.
```javascript
const stopLogging = mobxSpyLogger.start()
stopLogging()
```

## options

Select what should be logged:

```javascript
mobxSpyLogger.start({
  spyActions: Boolean = true,
  spyComputed: Boolean = true,
  spyUpdates: Boolean = true,
})
```

### options.loggers

Lets you customize the logs.
Your logger function will be called with a parsed event.

`mobx-spy-logger` parses the useful information from mobx spy events. Then, you can use it however you want.

```javascript
mobxSpyLogger.start({
  loggers: {
    logAction (parsedAction) {
      const {actor, actorId, actionName, eventArguments, isReaction} = parsedAction
      console.log(...)
    },

    logUpdate (parsedUpdate) {
      const {storeName, actorId, key, newValue} = parsedUpdate
      console.log(...)
    },

    logComputed (parsedComputed) {
      const {actor, actorId, key} = parsedComputed
      console.log(...)
    }
  }
})
```

#### Parsed properties

* **actor**: is usually the entity that triggered the event, like the store name or an element that was clicked.
* **actorId**: `mobx-spy-logger` tries to find a unique id on the actor (*eg: actor.id*), defaults to mobx unique id.
* **eventArguments**: string representation of the action / event arguments when available.
* **isReaction**: reaction events are also logged as "actions", this flag indicates if it was a reaction.
* **key**: in an update or computed event, it's the name of the property that was updated.
