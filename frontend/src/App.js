import React from 'react'
import './App.css'
import {Button} from 'antd'
import 'antd/dist/antd.css'
import TypesXmlEdit from './TypesXmlEdit'

const electron = window.require('electron')
const fs = electron.remote.require('fs')

class App extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      missionDirectory: null
    }
  }

  selectMissionDirectory(event) {
    electron.remote.dialog.showOpenDialog({
      properties: ['openDirectory']
    }, filePaths => this.setState({missionDirectory: filePaths[0]}))
  }

  render() {
    return (

      <div className="App">
        {
          this.state.missionDirectory ? (
            <TypesXmlEdit missionDirectory={this.state.missionDirectory}/>
          ) : (
            <div className="select-directory">
              <Button onClick={this.selectMissionDirectory.bind(this)}>Select Mission Directory</Button>
            </div>
          )
        }
      </div>
    )
  }
}

export default App
