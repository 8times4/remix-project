// eslint-disable-next-line no-use-before-define
import React, { useEffect, useRef, useState } from 'react'
import * as remixLib from '@remix-project/remix-lib'
import { ContractGUIProps } from '../types'
import { CopyToClipboard } from '@remix-ui/clipboard'
import { ButtonGroup, Dropdown } from 'react-bootstrap'

const txFormat = remixLib.execution.txFormat
export function ContractGUI (props: ContractGUIProps) {
  const [title, setTitle] = useState<string>('')
  const [basicInput, setBasicInput] = useState<string>('')
  const [toggleContainer, setToggleContainer] = useState<boolean>(false)
  const [buttonOptions, setButtonOptions] = useState<{
    title: string,
    content: string,
    classList: string,
    dataId: string
  }>({ title: '', content: '', classList: '', dataId: '' })
  const [selectedDeployIndex, setSelectedDeployIndex] = useState<number[]>([])
  const [showOptions, setShowOptions] = useState<boolean>(false)
  const [hasArgs, setHasArgs] = useState<boolean>(false)
  const multiFields = useRef<Array<HTMLInputElement | null>>([])
  const basicInputRef = useRef<HTMLInputElement>()

  useEffect(() => {
    if (props.title) {
      setTitle(props.title)
    } else if (props.funcABI.name) {
      setTitle(props.funcABI.name)
    } else {
      setTitle(props.funcABI.type === 'receive' ? '(receive)' : '(fallback)')
    }
    setBasicInput('')
    // we have the reset the fields before reseting the previous references.
    basicInputRef.current.value = ''
    multiFields.current.filter((el) => el !== null && el !== undefined).forEach((el) => el.value = '')
    multiFields.current = []

    const hasArgs = (props.funcABI.inputs && props.funcABI.inputs.length > 0) ||
    (props.funcABI.type === 'fallback') ||
    (props.funcABI.type === 'receive') ||
    (props.isDeploy && props.deployOption && (props.deployOption.options.length > 0))

    setHasArgs(hasArgs)
  }, [props.title, props.funcABI])

  useEffect(() => {
    if (props.lookupOnly) {
    //   // call. stateMutability is either pure or view
      setButtonOptions({
        title: title + ' - call',
        content: 'call',
        classList: 'btn-info',
        dataId: title + ' - call'
      })
    } else if (props.funcABI.stateMutability === 'payable' || props.funcABI.payable) {
    //   // transact. stateMutability = payable
      setButtonOptions({
        title: title + ' - transact (payable)',
        content: 'transact',
        classList: 'btn-danger',
        dataId: title + ' - transact (payable)'
      })
    } else {
    //   // transact. stateMutability = nonpayable
      setButtonOptions({
        title: title + ' - transact (not payable)',
        content: 'transact',
        classList: 'btn-warning',
        dataId: title + ' - transact (not payable)'
      })
    }
  }, [props.lookupOnly, props.funcABI, title])

  const getContentOnCTC = () => {
    const multiString = getMultiValsString()
    // copy-to-clipboard icon is only visible for method requiring input params
    if (!multiString) {
      return 'cannot encode empty arguments'
    }
    const multiJSON = JSON.parse('[' + multiString + ']')

    const encodeObj = txFormat.encodeData(
        props.funcABI,
        multiJSON,
        props.funcABI.type === 'constructor' ? props.evmBC : null)

    if (encodeObj.error) {
      console.error(encodeObj.error)
      return encodeObj.error
    } else {
      return encodeObj.data
    }
  }

  const switchMethodViewOn = () => {
    setToggleContainer(true)
    makeMultiVal()
  }

  const switchMethodViewOff = () => {
    setToggleContainer(false)
    const multiValString = getMultiValsString()

    if (multiValString) setBasicInput(multiValString)
  }

  const getMultiValsString = () => {
    const valArray = multiFields.current
    let ret = ''
    const valArrayTest = []

    for (let j = 0; j < valArray.length; j++) {
      if (ret !== '') ret += ','
      let elVal = valArray[j] ? valArray[j].value : ''

      valArrayTest.push(elVal)
      elVal = elVal.replace(/(^|,\s+|,)(\d+)(\s+,|,|$)/g, '$1"$2"$3') // replace non quoted number by quoted number
      elVal = elVal.replace(/(^|,\s+|,)(0[xX][0-9a-fA-F]+)(\s+,|,|$)/g, '$1"$2"$3') // replace non quoted hex string by quoted hex string
      if (elVal) {
        try {
          JSON.parse(elVal)
        } catch (e) {
          elVal = '"' + elVal + '"'
        }
      }
      ret += elVal
    }
    const valStringTest = valArrayTest.join('')

    if (valStringTest) {
      return ret
    } else {
      return ''
    }
  }

  const makeMultiVal = () => {
    let inputString = basicInput

    if (inputString) {
      inputString = inputString.replace(/(^|,\s+|,)(\d+)(\s+,|,|$)/g, '$1"$2"$3') // replace non quoted number by quoted number
      inputString = inputString.replace(/(^|,\s+|,)(0[xX][0-9a-fA-F]+)(\s+,|,|$)/g, '$1"$2"$3') // replace non quoted hex string by quoted hex string
      const inputJSON = JSON.parse('[' + inputString + ']')
      const multiInputs = multiFields.current

      for (let k = 0; k < multiInputs.length; k++) {
        if (inputJSON[k]) {
          multiInputs[k].value = JSON.stringify(inputJSON[k])
        }
      }
    }
  }

  const handleActionClick = () => {
    const deployMode = selectedDeployIndex.map(index => props.deployOption[index].title)

    props.clickCallBack(props.funcABI.inputs, basicInput, props.isDeploy ? deployMode : null)
  }

  const handleBasicInput = (e) => {
    const value = e.target.value

    setBasicInput(value)
  }

  const handleExpandMultiClick = () => {
    const valsString = getMultiValsString()

    if (valsString) {
      props.clickCallBack(props.funcABI.inputs, valsString)
    } else {
      props.clickCallBack(props.funcABI.inputs, '')
    }
  }

  const setSelectedDeploy = (index: number) => {
    const indexes = selectedDeployIndex.slice()
    const existingIndex = indexes.findIndex(value => value === index)

    if (existingIndex > -1) indexes.splice(existingIndex, 1)
    else indexes.push(index)
    setSelectedDeployIndex(indexes)
  }

  const toggleOptions = () => {
    setShowOptions(!showOptions)
  }

  return (
    <div className={`udapp_contractProperty ${hasArgs ? 'udapp_hasArgs' : ''}`}>
      <div className="udapp_contractActionsContainerSingle pt-2" style={{ display: toggleContainer ? 'none' : 'flex' }}>
        {
          props.isDeploy && props.deployOption && (props.deployOption.options || []).length > 0 ? 
          <Dropdown as={ButtonGroup} show={showOptions}>
            <button onClick={handleActionClick} title={buttonOptions.title} className={`udapp_instanceButton ${props.widthClass} btn btn-sm ${buttonOptions.classList}`} data-id={buttonOptions.dataId}>Deploy</button>
            <Dropdown.Toggle split id="dropdown-split-basic" className={`btn btn-sm dropdown-toggle dropdown-toggle-split ${buttonOptions.classList}`} style={{ maxWidth: 25, minWidth: 0, height: 32 }} onClick={toggleOptions} />
            <Dropdown.Menu className="deploy-items border-0">
              {
                (props.deployOption.options).map(({ title, active }, index) => <Dropdown.Item onClick={() => setSelectedDeploy(index)}> { selectedDeployIndex.includes(index) ? <span>&#10003; {title} </span> : <span className="pl-3">{title}</span> }</Dropdown.Item>)
              }
            </Dropdown.Menu>
          </Dropdown> : <button onClick={handleActionClick} title={buttonOptions.title} className={`udapp_instanceButton ${props.widthClass} btn btn-sm ${buttonOptions.classList}`} data-id={buttonOptions.dataId}>{title}</button>
        }
        {
          props.isDeploy && props.deployOption && props.deployOption.inputs.inputs.length > 0 && 
          <>
            <input
              className="form-control"
              data-id={props.deployOption.inputs.type === 'fallback' || props.deployOption.inputs.type === 'receive' ? `'(${props.deployOption.inputs.type}')` : 'multiParamManagerBasicInputField'}
              placeholder={props.deployOption.initializeInputs}
              title={props.deployOption.inputs.type === 'fallback' || props.deployOption.inputs.type === 'receive' ? `'(${props.deployOption.inputs.type}')` : props.deployOption.initializeInputs}
              onChange={handleBasicInput}
              ref={basicInputRef}
              style={{ visibility: !((props.deployOption.inputs.inputs && props.deployOption.inputs.inputs.length > 0) || (props.deployOption.inputs.type === 'fallback') || (props.deployOption.inputs.type === 'receive')) ? 'hidden' : 'visible' }} />
            <i
              className="fas fa-angle-down udapp_methCaret"
              onClick={switchMethodViewOn}
              title={title}
              style={{ visibility: !(props.deployOption.inputs.inputs && props.deployOption.inputs.inputs.length > 0) ? 'hidden' : 'visible' }}>
            </i>
          </>
        }
        { !props.deployOption && <>
            <input
              className="form-control"
              data-id={props.funcABI.type === 'fallback' || props.funcABI.type === 'receive' ? `'(${props.funcABI.type}')` : 'multiParamManagerBasicInputField'}
              placeholder={props.inputs}
              title={props.funcABI.type === 'fallback' || props.funcABI.type === 'receive' ? `'(${props.funcABI.type}')` : props.inputs}
              onChange={handleBasicInput}
              ref={basicInputRef}
              style={{ visibility: !((props.funcABI.inputs && props.funcABI.inputs.length > 0) || (props.funcABI.type === 'fallback') || (props.funcABI.type === 'receive')) ? 'hidden' : 'visible' }} />
            <i
              className="fas fa-angle-down udapp_methCaret"
              onClick={switchMethodViewOn}
              title={title}
              style={{ visibility: !(props.funcABI.inputs && props.funcABI.inputs.length > 0) ? 'hidden' : 'visible' }}>
            </i>
          </>
        }
      </div>
      {
          props.isDeploy && props.deployOption && props.deployOption.inputs.inputs.length > 0 && 
          <div className="udapp_contractActionsContainerMulti" style={{ display: toggleContainer ? 'flex' : 'none' }}>
            <div className="udapp_contractActionsContainerMultiInner text-dark">
              <div onClick={switchMethodViewOff} className="udapp_multiHeader">
                <div className="udapp_multiTitle run-instance-multi-title">{title}</div>
                <i className='fas fa-angle-up udapp_methCaret'></i>
              </div>
              <div>
                {props.deployOption.inputs.inputs.map((inp, index) => {
                  return (
                    <div className="udapp_multiArg" key={index}>
                      <label htmlFor={inp.name}> {inp.name}: </label>
                      <input ref={el => { multiFields.current[index] = el }} className="form-control" placeholder={inp.type} title={inp.name} data-id={`multiParamManagerInput${inp.name}`} />
                    </div>)
                })}
              </div>
            <div className="udapp_group udapp_multiArg">
              {/* <CopyToClipboard tip='Encode values of input fields & copy to clipboard' icon='fa-clipboard' direction={'left'} getContent={getContentOnCTC} /> */}
              <button onClick={handleExpandMultiClick} title={buttonOptions.title} data-id={buttonOptions.dataId} className={`udapp_instanceButton ${buttonOptions.classList}`}>{ buttonOptions.content }</button>
            </div>
          </div>
        </div>
      }
      { !props.deployOption && 
        <div className="udapp_contractActionsContainerMulti" style={{ display: toggleContainer ? 'flex' : 'none' }}>
          <div className="udapp_contractActionsContainerMultiInner text-dark">
            <div onClick={switchMethodViewOff} className="udapp_multiHeader">
              <div className="udapp_multiTitle run-instance-multi-title">{title}</div>
              <i className='fas fa-angle-up udapp_methCaret'></i>
            </div>
            <div>
              {props.funcABI.inputs.map((inp, index) => {
                return (
                  <div className="udapp_multiArg" key={index}>
                    <label htmlFor={inp.name}> {inp.name}: </label>
                    <input ref={el => { multiFields.current[index] = el }} className="form-control" placeholder={inp.type} title={inp.name} data-id={`multiParamManagerInput${inp.name}`} />
                  </div>)
              })}
            </div>
          <div className="udapp_group udapp_multiArg">
            <CopyToClipboard tip='Encode values of input fields & copy to clipboard' icon='fa-clipboard' direction={'left'} getContent={getContentOnCTC} />
            <button onClick={handleExpandMultiClick} title={buttonOptions.title} data-id={buttonOptions.dataId} className={`udapp_instanceButton ${buttonOptions.classList}`}>{ buttonOptions.content }</button>
          </div>
        </div>
      </div>
    }
    </div>
  )
}
