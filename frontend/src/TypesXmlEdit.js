import React from 'react'
import {Table, Form, Input, Button, Popconfirm} from 'antd'
import './TypesXmlEdit.css'

const electron = window.require('electron')
const fs = electron.remote.require('fs')


const mapType = type => {
  const nominal = type.getElementsByTagName('nominal')[0]
  return {
    name: type.getAttribute('name'),
    nominal: nominal ? parseInt(nominal.textContent, 10) : null
  }
}

const FormItem = Form.Item
const EditableContext = React.createContext()

const EditableRow = ({form, index, ...props}) => (
  <EditableContext.Provider value={form}>
    <tr {...props} />
  </EditableContext.Provider>
)

const EditableFormRow = Form.create()(EditableRow)

class EditableCell extends React.Component {
  state = {
    editing: false,
  }

  componentDidMount() {
    if (this.props.editable) {
      document.addEventListener('click', this.handleClickOutside, true)
    }
  }

  componentWillUnmount() {
    if (this.props.editable) {
      document.removeEventListener('click', this.handleClickOutside, true)
    }
  }

  toggleEdit = () => {
    const editing = !this.state.editing
    this.setState({editing}, () => {
      if (editing) {
        this.input.focus()
      }
    })
  }

  handleClickOutside = (e) => {
    const {editing} = this.state
    if (editing && this.cell !== e.target && !this.cell.contains(e.target)) {
      this.save()
    }
  }

  save = () => {
    const {record, handleSave} = this.props
    this.form.validateFields((error, values) => {
      if (error) {
        return
      }
      this.toggleEdit()
      handleSave({...record, ...values})
    })
  }

  render() {
    const {editing} = this.state
    const {
      editable,
      dataIndex,
      title,
      record,
      index,
      handleSave,
      ...restProps
    } = this.props
    return (
      <td ref={node => (this.cell = node)} {...restProps}>
        {editable ? (
          <EditableContext.Consumer>
            {(form) => {
              this.form = form
              return (
                editing ? (
                  <FormItem style={{margin: 0}}>
                    {form.getFieldDecorator(dataIndex, {
                      rules: [{
                        required: true,
                        message: `${title} is required.`,
                      }],
                      initialValue: record[dataIndex],
                    })(
                      <Input
                        className='table-edit-field'
                        ref={node => (this.input = node)}
                        onPressEnter={this.save}
                      />
                    )}
                  </FormItem>
                ) : (
                  <div
                    className="editable-cell-value-wrap"
                    style={{paddingRight: 24}}
                    onClick={this.toggleEdit}
                  >
                    {restProps.children}
                  </div>
                )
              )
            }}
          </EditableContext.Consumer>
        ) : restProps.children}
      </td>
    )
  }
}


export default class TypesXmlEdit extends React.Component {

  state = {
    dataSource: []
  }

  columns = [{
    title: 'Name',
    dataIndex: 'name',
    key: 'name',
  }, {
    title: 'Usages',
    dataIndex: 'usages',
    key: 'usages',
  }, {
    title: 'Nominal',
    dataIndex: 'nominal',
    key: 'nominal',
    width: 100,
    editable: true
  }, {
    title: 'Lifetime',
    dataIndex: 'lifetime',
    key: 'lifetime',
  }, {
    title: 'Restock',
    dataIndex: 'restock',
    key: 'restock',
  }, {
    title: 'Min. amount',
    dataIndex: 'min',
    key: 'min',
  }, {
    title: 'Quantity',
    children: [{
      title: 'Min. quantity',
      dataIndex: 'quantmin',
      key: 'quantmin'
    }, {
      title: 'Max. quantity',
      dataIndex: 'quantmax',
      key: 'quantmax'
    }]
  }, {
    title: 'Cost',
    dataIndex: 'cost',
    key: 'cost',
  }]

  mapXmlData = xmlString => {
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml')
    const types = Array.from(xmlDoc.getElementsByTagName('type'))
    console.log(types)
    const dataSource = types.map(mapType)
    console.log(dataSource)
    this.setState({dataSource})
  }

  componentDidMount() {
    fs.readFile(`${this.props.missionDirectory}\\db\\types.xml`, (err, data) => {
      if (err) {
        return console.error(err)
      }
      this.mapXmlData(data.toString())
    })
  }

  handleSave = row => {
    const newData = [...this.state.dataSource]
    const index = newData.findIndex(type => row.name === type.name)
    newData.splice(index, 1, {
      ...newData[index],
      ...row
    })
    this.setState({
      dataSource: newData
    })
  }

  render() {

    const components = {
      body: {
        row: EditableFormRow,
        cell: EditableCell,
      },
    }

    const columns = this.columns.map((col) => {
      if (!col.editable) {
        return col
      }
      return {
        ...col,
        onCell: record => ({
          record,
          editable: col.editable,
          dataIndex: col.dataIndex,
          title: col.title,
          handleSave: this.handleSave,
        }),
      }
    })

    return (
      <Table
        components={components}
        dataSource={this.state.dataSource}
        columns={columns}>
      </Table>
    )
  }
}