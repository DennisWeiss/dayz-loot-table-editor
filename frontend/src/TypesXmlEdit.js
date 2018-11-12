import React from 'react'
import {Table, Form, Input, Button, Popconfirm, Tag} from 'antd'
import './TypesXmlEdit.css'
import {hashOfString} from './helper/helper-functions'

const electron = window.require('electron')
const fs = electron.remote.require('fs')

const tagColors = {
  weapons: 'red',
  food: 'green',
  clothes: 'purple',
  tools: 'blue',
  containers: 'cyan'
}

const mapType = type => {
  const nominal = type.getElementsByTagName('nominal')[0]
  const lifetime = type.getElementsByTagName('lifetime')[0]
  const restock = type.getElementsByTagName('restock')[0]
  const min = type.getElementsByTagName('min')[0]
  const quantmin = type.getElementsByTagName('quantmin')[0]
  const quantmax = type.getElementsByTagName('quantmax')[0]
  const cost = type.getElementsByTagName('cost')[0]
  const category = type.getElementsByTagName('category')[0]

  return {
    name: type.getAttribute('name'),
    nominal: nominal ? parseInt(nominal.textContent, 10) : null,
    lifetime: lifetime ? parseInt(lifetime.textContent, 10) : null,
    restock: restock ? parseInt(restock.textContent, 10) : null,
    min: min ? parseInt(min.textContent, 10) : null,
    quantmin: quantmin ? parseInt(quantmin.textContent, 10) : null,
    quantmax: quantmax ? parseInt(quantmax.textContent, 10) : null,
    cost: quantmax ? parseInt(cost.textContent, 10) : null,
    category: category ? category.getAttribute('name') : null
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
    title: 'Item',
    dataIndex: 'name',
    key: 'name',
    render: (text, record, index) => (
      <div>
        <span className='item-name-col'>{text}</span>
        {
          record.category &&
          <Tag color={tagColors[record.category]}>
            {record.category}
          </Tag>
        }

      </div>
    )
  }, {
    title: 'Usages',
    dataIndex: 'usages',
    key: 'usages'
  }, {
    title: 'Nominal',
    dataIndex: 'nominal',
    key: 'nominal',
    editable: true
  }, {
    title: 'Lifetime',
    dataIndex: 'lifetime',
    key: 'lifetime',
    editable: true
  }, {
    title: 'Restock',
    dataIndex: 'restock',
    key: 'restock',
    editable: true
  }, {
    title: 'Min. amount',
    dataIndex: 'min',
    key: 'min',
    editable: true
  }, {
    title: 'Quantity',
    children: [{
      title: 'Min. quantity',
      dataIndex: 'quantmin',
      key: 'quantmin',
      editable: true
    }, {
      title: 'Max. quantity',
      dataIndex: 'quantmax',
      key: 'quantmax',
      editable: true
    }]
  }, {
    title: 'Cost',
    dataIndex: 'cost',
    key: 'cost',
    editable: true
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
        size='small'
        components={components}
        dataSource={this.state.dataSource}
        columns={columns}>
      </Table>
    )
  }
}