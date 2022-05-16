import { NightwatchBrowser, NightwatchAPI } from 'nightwatch'
import EventEmitter from 'events'

/*
  Switches between browser tabs
*/

class SwitchBrowserTab extends EventEmitter {
  command (this: NightwatchBrowser, index: number): NightwatchBrowser {
    this.api.perform((browser: NightwatchAPI, done) => {
      browser.windowHandles((result) => {
        console.log('SwitchBrowserTab', result, result.value[index])
        console.log(typeof result.value[index])
        browser.switchWindow(result.value[index])
        done()
      })
      this.emit('complete')
    })
    return this
  }
}

module.exports = SwitchBrowserTab
