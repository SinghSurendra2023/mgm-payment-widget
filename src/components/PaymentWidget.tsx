import { TextField, Autocomplete, InputAdornment } from "@mui/material";
import { Field, Form, FormRenderProps } from 'react-final-form';
import React, { ChangeEvent, SyntheticEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from 'react-router-dom';
import "./PaymentWidget.css";
import {
  PaymentWidgetInterface, PaymentWidgetFormFields, countries,
  Option, ValidationErrors, getStateByCountry
} from './PaymentWidget.type';
import { number, cvv, cardholderName } from 'card-validator';

import NodeRSA from 'node-rsa';

import {
  addressLine1Validation,
  addressLine2Validation,
  cityValidation,
  countryValidation,
  stateValidation,
  zipValidation
} from './PaymentWidget.validation';



const PaymentWidget = () => {
  const [name, setName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState("");
  const [cvvValue, setCvvValue] = useState("");
  const [country, setCountry] = useState("");
  const [address, setAddress] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [cardType, setCardType] = useState('');
  const [maskedNumber, setMaskedNumber] = useState('');
  const [termsField, setTermsField] = useState(true);
  const [isCardNumberOutOfFocus, setIsCardNumberOutOfFocus] = useState(false);

  const [sessionId, setSessionId] = useState('');
  const [clientId, setClientId] = useState('');

  const RSAKey = new NodeRSA().importKey(
    'MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAzFq5yGKa9LwASusdJJGpNM5zAm0GDYvU9jeoSIfYBe9h9XWWrlOkEFm9jmcVF653AmA0iYQwouSUOw/bGZslqMenJ2s0tMRzS9t6c+1XPDa9/o1F7vxsKbJatw4E26ZnCdpNgYGSS3tWm17BBPIc5+HULHAIQthzQvNdlUsSWqHEQbgR+4G+JfZqWdk2cLw4goeRUNoM0Y4QoVACVN82eH9E2NXMmA8kMl9UFsxufPCfF4yQ6NwXrYSV5bEvX63ROPh2nEY+ptYghDPLghaGqv/bEMF6+WhY/rJI/oWOkkyDuSLGhTPWpCbSDq6yrpth1DPaywz4XhM/T3ZyPLvefzxmokibNaU+G+WdLLd4h9JDRsA1aYP6tvkZ0x9PMgU7YpJ9up2/5Av6BgtHiGs9f3y+mjuqJD3jZvQCKPTvFDDjleatgPRfaE50VcK5MiI3L7uYQ1RHQNf6IeIAwEDUwsXdYra9cZSsG30kk+mmHC9Iv1hUVPTlflJ6LSukmakZppDeUOlKQywIxSgHi6EsJQj0v2/O76OEX/snjYvr5yhqy7GwAsjugkUJMRGxu9h+vs3fklI4Fv/1+oLAUV9hZuYglqQByFN5TYKTHUglNsUiqhOzZ2RUdJ+Jjlg5g58DqfsqDLnobV8jnuqbINruqtjtYmZ+RkH2NwskQYNVof0CAwEAAQ==',
    'pkcs8-public-pem',
  );

  ////***** CREDIT CARD VALIDATION */

  const [cardNumberError, setCardNumberError] = useState(false);
  const [expiryYearError, setExpiryYearError] = useState('');
  const [expiryMonthError, setExpiryMonthError] = useState('');
  const [isNameValid, setIsNameValid] = useState(true);
  const [nameError, setNameError] = useState(false);
  const [cvvError, setCvvError] = useState('');




  const validateCardNumber = useCallback(() => {
    const validation = number(cardNumber)
    if (cardNumber !== '') {
      const cardError = validation.isValid ? false : true;
      setCardNumberError(cardError)
    };
  }, [cardNumber])

  const saveCardType = useCallback(() => {
    const cardTypeResult = number(cardNumber);
    const newCardType = cardTypeResult.card ? cardTypeResult.card.type : '';
    setCardType(newCardType);
  }, [cardNumber])

  const createMaskedNumber = useCallback(() => {
    const numbersToObscure = cardType === 'american-express' ? 11 : 12;
    const newMaskedNumber = cardNumber
      .split('')
      .map((number: string, index: number) => index < numbersToObscure ? '*' : number)
      .join('');
    setMaskedNumber(newMaskedNumber)
    //console.log('createMaskedNumber clientId ==>', clientId, ' sessionId==>', sessionId)

  }, [cardNumber, cardType])

  // validate cardNumber and determine cardType when cardNumber changes
  useMemo(() => {
    validateCardNumber();
    saveCardType()
    createMaskedNumber()
  }, [validateCardNumber, saveCardType, createMaskedNumber])


  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    const inputName = event.target.value;
    setName(inputName);

    // Validate the name using card-validator
    const isValid = cardholderName(inputName).isValid;
    setIsNameValid(isValid);
    setNameError(isNameValid ? false : true)
  };

  const handleCardNumberChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target?.value;
    const numbersAllowed = cardType === 'american-express' ? 15 : 16;

    if (value.length <= numbersAllowed) {
      setCardNumber(value);
    }
  };

  const getCardIcon = () => {
    if (cardNumber === '') {
      return null;
    }

    const cardTypeResult = number(cardNumber);
    if (cardTypeResult.card) {
      const cardType = cardTypeResult.card.type;
      const cardIcon = getCardIconForType(cardType);
      return cardIcon;
    }

    return null;
  };

  const getCardIconForType = (cardType: string) => {
    // Add icons for different card types as required (using Material-UI icons or custom images)
    switch (cardType) {
      case 'visa':
        return <span>Visa</span>;
      case 'mastercard':
        return <span>Mastercard</span>;
      case 'american-express':
        return <span>Amex</span>;
      case 'discover':
        return <span>Discover</span>;
      default:
        return null;
    }
  };


  const handleExpiryMonthChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    const month = parseInt(value);
    if (value === '' || (month >= 1 && month <= 12)) {
      setExpiryMonth(value);
      setExpiryMonthError('');
    } else {
      setExpiryMonth('');
      setExpiryMonthError('Invalid month');
    }
  };

  const handleExpiryYearChange = (event: ChangeEvent<HTMLInputElement>) => {
    const inputYear = event.target.value;
    const currentYear = new Date().getFullYear();
    setExpiryYear(inputYear);

    if (/^\d{4}$/.test(inputYear) && (parseInt(inputYear) >= currentYear && parseInt(inputYear) < currentYear + 20)) {
      setExpiryYear(inputYear);
      setExpiryYearError('');
    } else {
      setExpiryYearError('Invalid Year');
    }
  };

  const handleCvvChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setCvvValue(value);
    const cardType = number(cardNumber).card?.type;
    if (cardType === 'american-express') {
      const validation = cvv(value, 4);
      setCvvError(validation.isValid ? '' : 'Invalid CVV (must be 4 digits)');
    } else {
      const validation = cvv(value);
      setCvvError(validation.isValid ? '' : 'Invalid CVV (must be 3 digits)');
    }
  };


  ////// */

  const txtCountryRef = useRef<HTMLDivElement>(null)
  const helperText = '*Required'

  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {

    if (window && window.parent) {
      const dimesions = {
        height: Math.max(
          window.document.body.scrollHeight, window.document.documentElement.scrollHeight,
          window.document.body.offsetHeight, window.document.documentElement.offsetHeight,
          window.document.body.clientHeight, window.document.documentElement.clientHeight
        ),
        width: Math.max(
          window.document.body.scrollWidth, window.document.documentElement.scrollWidth,
          window.document.body.offsetWidth, window.document.documentElement.offsetWidth,
          window.document.body.clientWidth, window.document.documentElement.clientWidth
        )
      }
      window.parent.postMessage(dimesions, '*')


      window.addEventListener('message', (ev: MessageEvent) => {
        const parmas = ev.data;
        if (parmas) {

          if (parmas.clientId)
            setClientId(parmas.clientId)

          if (parmas.sessionId)
            setSessionId(parmas.sessionId)
        }

      })
    }

  }, [searchParams])


  useEffect(() => {
    console.log('Inside Widget sessionId ==>', sessionId, ' clientId==>', clientId)
  }, [sessionId, clientId])

  const updateTermsAndCondition = (errorsResult: ValidationErrors) => {
    const addressError =
      Object.keys(errorsResult).length

    const cardError = cardNumberError || (expiryYearError != '') || (expiryMonthError != '') || nameError || (cvvError != '')

    if ((addressError > 0) || cardError) {
      setTermsField(true)
    }
    else {
      setTermsField(false)
    }
  }

  const onValidate = (values: PaymentWidgetInterface): ValidationErrors => {

    const billingAddressLine1Error = addressLine1Validation(values.billingAddressLine1)

    const billingAddressLine2Error = addressLine2Validation(values.billingAddressLine2)

    const billingCountryError = countryValidation(values.billingCountry)

    const billingZipCodeError = zipValidation(values.billingZipCode, values.billingCountry)

    const billingStateError = stateValidation(values.billingState, values.billingCountry)

    const billingCityError = cityValidation(values.billingCity)


    let errorsResult: ValidationErrors = {
      ...(billingAddressLine1Error && { billingAddressLine1: billingAddressLine1Error }),
      ...(billingAddressLine2Error && { billingAddressLine2: billingAddressLine2Error }),
      ...(billingCountryError && { billingCountry: billingCountryError }),
      ...(billingZipCodeError && { billingZipCode: billingZipCodeError }),
      ...(billingStateError && { billingState: billingStateError }),
      ...(billingCityError && { billingCity: billingCityError }),
    }

    updateTermsAndCondition(errorsResult)

    return errorsResult
  }

  const getDisplayText = (props: FormRenderProps<PaymentWidgetInterface, Partial<PaymentWidgetInterface>>) => {
    return (props.values.billingCountry === 'US' || props.values.billingCountry === 'CA') ? helperText : ''
  }

  useEffect(() => {
    //console.log('isCardNumberOutOfFocus ==>', isCardNumberOutOfFocus, 'cardNumberError ==>', cardNumberError)
    const numbersAllowed = cardType === 'american-express' ? 15 : 16;
    if (isCardNumberOutOfFocus && maskedNumber && cardNumber.length === numbersAllowed && !(cardNumberError)) {
      const encrptdPan = RSAKey.encrypt(cardNumber, 'base64');
      console.log('encrptdPan ==>', encrptdPan)
      generateToken(encrptdPan, clientId, '')
    }
  }, [isCardNumberOutOfFocus, maskedNumber, cardType, cardNumber, cardNumberError])


  const generateToken = async (encrptdPan: string, clientId: string, jwtToken: string) => {
    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: clientId,
        JWTToken: 'sfsd343434',
        MGMToken: 'sdsdfds1223232',
        'sessionId': sessionId
      })
    };

    const reponse = await fetch('http://localhost:8083/tokenizationService/generatetoken', requestOptions)

    const data = await reponse.json();

    console.log('data ==>', data);

    window.parent.postMessage({ enablePurchaseButton: true }, '*')
  }

  return (
    <div >
      <div className="container">
        <Form<PaymentWidgetInterface>
          onSubmit={() => {
            // not used, but required
          }}
          validate={onValidate}
          initialValues={{
            ...PaymentWidgetFormFields
          }}
        >
          {props => {
            return (
              <form id="">
                <div className="bold-change info-header mbot">
                  Payment Information
                </div>
                <div>
                  <img
                    src="https://static.mgmresorts.com/content/dam/MGM/corporate/website-graphics/credit-card/payment-icons-mgm-rewards.svg"
                    alt="MGM Rewards Master Card"
                  />
                  <img
                    src="https://static.mgmresorts.com/content/dam/MGM/corporate/website-graphics/credit-card/payment-icons-master-card.svg"
                    alt="Mastercard"
                  />
                  <img
                    src="https://static.mgmresorts.com/content/dam/MGM/corporate/website-graphics/credit-card/payment-icons-visa.svg"
                    alt="Visa"
                  />
                  <img
                    src="https://static.mgmresorts.com/content/dam/MGM/corporate/website-graphics/credit-card/payment-icons-american-express.svg"
                    alt="American Express"
                  />
                  <img
                    src="https://static.mgmresorts.com/content/dam/MGM/corporate/website-graphics/credit-card/payment-icons-discover.svg"
                    alt="Discover"
                  />
                  <img
                    src="https://static.mgmresorts.com/content/dam/MGM/corporate/website-graphics/credit-card/payment-icons-jcb.svg"
                    alt="JCB"
                  />
                  <img
                    src="https://static.mgmresorts.com/content/dam/MGM/corporate/website-graphics/credit-card/payment-icons-union-pay.svg"
                    alt="Union Pay"
                  />
                </div>
                <div className="mbot">
                  <TextField
                    id="filled-basic"
                    label="Cardholder Name"
                    variant="filled"
                    className="bold-change"
                    value={name}
                    onChange={handleNameChange}
                    InputLabelProps={{
                      style: {
                        fontWeight: 700,
                        fontSize: "13px",
                        marginTop: "4px",
                      },
                    }}
                    inputProps={{ style: { fontWeight: "bold", width: "640px" } }}
                    helperText={nameError ? "Invalid Name" : "*Required"}
                    error={nameError} />
                </div>
                <div className="mbot">
                  <TextField
                    id="filled-basic"
                    label="Card Number"
                    variant="filled"
                    className="bold-change"
                    value={isCardNumberOutOfFocus ? maskedNumber : cardNumber}
                    onChange={handleCardNumberChange}
                    onBlur={() => setIsCardNumberOutOfFocus(true)}
                    onFocus={() => setIsCardNumberOutOfFocus(false)}
                    InputLabelProps={{
                      style: {
                        fontWeight: 700,
                        fontSize: "13px",
                        marginTop: "4px",
                      },
                    }}
                    inputProps={{ style: { fontWeight: "bold", width: "640px" } }}
                    helperText={cardNumberError ? "Invalid Card Number" : "*Required"}
                    error={cardNumberError}
                  />
                </div>
                {cardType && <p className="bold-change">CARD TYPE: {cardType.toUpperCase()}</p>}
                <div className="month-year">
                  <TextField
                    id="filled-basic"
                    label="Month"
                    value={expiryMonth}
                    onChange={handleExpiryMonthChange}
                    variant="filled"
                    className="bold-change"
                    InputLabelProps={{
                      style: {
                        fontWeight: 700,
                        fontSize: "13px",
                        marginTop: "4px",
                      },
                    }}
                    inputProps={{
                      style: { fontWeight: "bold", width: "320px" },
                    }}
                    error={Boolean(expiryMonthError)}
                    helperText={expiryMonthError}

                  />

                  <div className="mbot">
                    <TextField
                      id="filled-basic"
                      label="Year"
                      variant="filled"
                      className="bold-change"
                      value={expiryYear}
                      onChange={handleExpiryYearChange}
                      InputLabelProps={{
                        style: {
                          fontWeight: 700,
                          fontSize: "13px",
                          marginTop: "4px",
                        },
                      }}
                      inputProps={{
                        style: { fontWeight: "bold", width: "280px" },
                      }}
                      error={Boolean(expiryYearError)}
                      helperText={expiryYearError}
                    />
                  </div>
                </div>
                <div className="mbot">
                  <TextField
                    id="filled-basic"
                    label="CVV"
                    type='password'
                    value={cvvValue}
                    onChange={handleCvvChange}
                    variant="filled"
                    className="bold-change"
                    InputLabelProps={{
                      style: {
                        fontWeight: 700,
                        fontSize: "13px",
                        marginTop: "4px",
                      },
                    }}
                    inputProps={{
                      style: { fontWeight: "bold", width: "640px" },
                    }}
                    error={Boolean(cvvError)}
                    helperText={cvvError}
                  />
                </div>
                <div className="mbot info-header">Billing Address</div>
                <div className="mbot">
                  <Field name="billingCountry">
                    {({ input, meta }) => {
                      const { error, touched, submitError } = meta;
                      const isError = (error && touched) ? true : false
                      //console.log('billingCountry isError ==>', isError)
                      return (<Autocomplete
                        id="ddlCountry"
                        options={countries}
                        disableClearable
                        freeSolo
                        selectOnFocus
                        clearOnBlur
                        // value={country}
                        onChange={(event, newValue) => {
                          let option1 = (newValue as Option);

                          if (option1) {
                            setCountry(option1.value)
                            setState('')

                            if (input.onChange) {
                              input.onChange(option1.value);
                            }
                          }
                        }}
                        renderInput={(params) =>
                          <div ref={params.InputProps.ref}>
                            <TextField {...params} label="Country"
                              helperText={isError ? error : helperText}
                              error={isError}
                              type="text"
                              InputProps={{
                                style: { fontWeight: "bold", width: "660px" },
                                ...params.InputProps,
                                ...input
                              }}
                              InputLabelProps={{
                                style: {
                                  fontWeight: 700,
                                  fontSize: "13px",
                                  marginTop: "4px",
                                },
                              }}
                              className="bold-change"
                              variant="filled"
                            />
                          </div>}
                      />)
                    }
                    }
                  </Field>
                </div>
                <div className="mbot">
                  <Field name="billingAddressLine1">
                    {({ input, meta }) => {
                      const { error, touched, submitError } = meta;
                      const isError = (error && touched) ? true : false
                      // console.log('billingAddressLine1 isError ==>', isError)
                      return (
                        <TextField
                          id="filled-basic"
                          label="Address Line 1"
                          variant="filled"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className="bold-change"
                          InputLabelProps={{
                            style: {
                              fontWeight: 700,
                              fontSize: "13px",
                              marginTop: "4px",
                            },
                          }}
                          inputProps={{
                            style: { fontWeight: "bold", width: "640px" },
                            ...input
                          }}
                          helperText={isError ? error || submitError : helperText}
                          error={isError}
                        />)
                    }
                    }
                  </Field>
                </div>
                <div className="mbot">
                  <Field name="billingAddressLine2">
                    {({ input, meta }) => {
                      const { error, submitError, touched } = meta;
                      const isError = (error && touched) ? true : false
                      //console.log('billingAddressLine2 isError ==>', isError)
                      return (
                        <TextField
                          id="filled-basic"
                          label="Address Line 2"
                          variant="filled"
                          className="bold-change"
                          value={address2}
                          onChange={(e) => setAddress2(e.target.value)}
                          style={{ marginBottom: '5px' }}
                          InputLabelProps={{
                            style: {
                              fontWeight: 700,
                              fontSize: "13px",
                              marginTop: "4px",
                            },
                          }}
                          inputProps={{
                            style: { fontWeight: "bold", width: "640px" },
                            ...input
                          }}
                          helperText={isError ? error : ''}
                          error={isError}
                        />)
                    }
                    }
                  </Field>
                </div>

                <div className="mbot">
                  <Field name="billingCity">
                    {({ input, meta }) => {
                      const { error, submitError, touched } = meta;
                      const isError = (error && touched) ? true : false
                      //console.log('billingAddressLine2 isError ==>', isError)
                      return (
                        <TextField
                          id="filled-basic"
                          label="City"
                          variant="filled"
                          className="bold-change"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          InputLabelProps={{
                            style: {
                              fontWeight: 700,
                              fontSize: "13px",
                              marginTop: "4px",
                            },
                          }}
                          inputProps={{
                            style: { fontWeight: "bold", width: "640px" },
                            ...input
                          }}
                          helperText={isError ? error : helperText}
                          error={isError}
                        />)
                    }
                    }
                  </Field>
                </div>
                <div className="mbot">
                  <Field name="billingState">
                    {({ input, meta }) => {
                      const { error, touched, submitError, modified } = meta;
                      const isError = (error && (touched)) ? true : false
                      //console.log('billingState  ==>', props.values.billingState, 'state ==>', state)
                      const displayText = isError ? error : getDisplayText(props)
                      return (<Autocomplete
                        id="ddlState"
                        options={getStateByCountry(props.values.billingCountry)}
                        disableClearable
                        freeSolo
                        selectOnFocus
                        //clearOnBlur
                        // value={country}
                        style={{ marginBottom: "20px" }}
                        onChange={(event, newValue) => {
                          //console.log('On country change', newValue)
                          let option1 = (newValue as Option);
                          //console.log('OutSide State')
                          if (option1) {
                            //console.log('Inside State')
                            setState(option1.label)
                            if (input.onChange) {
                              input.onChange(option1.label);
                            }
                          }
                        }}
                        renderInput={(params) =>
                          <div ref={params.InputProps.ref}>
                            <TextField {...params} label="State/Province"
                              helperText={displayText}
                              error={isError}
                              type="text"
                              InputProps={{
                                style: { fontWeight: "bold", width: "660px" },
                                ...params.InputProps,
                                ...input
                              }}
                              InputLabelProps={{
                                style: {
                                  fontWeight: 700,
                                  fontSize: "13px",
                                  marginTop: "4px",
                                },
                              }}
                              className="bold-change"
                              variant="filled"

                            />
                          </div>}
                      />)
                    }
                    }
                  </Field>
                </div>
                <div className="mbot">
                  <Field name="billingZipCode">
                    {({ input, meta }) => {
                      const { error, submitError, touched } = meta;
                      const isError = (error && touched) ? true : false
                      //console.log('zipCode isError ==>', isError, ' country==>', country)
                      const displayText = isError ? error : getDisplayText(props)
                      return (
                        <TextField
                          id="filled-basic"
                          label="Zip/Postal Code"
                          variant="filled"
                          className="bold-change"
                          value={address2}
                          onChange={(e) => setAddress2(e.target.value)}
                          InputLabelProps={{
                            style: {
                              fontWeight: 700,
                              fontSize: "13px",
                              marginTop: "4px",
                            },
                          }}
                          inputProps={{
                            style: { fontWeight: "bold", width: "640px" },
                            ...input
                          }}
                          helperText={displayText}
                          error={isError}
                        />)
                    }
                    }
                  </Field>
                </div>
              </form>
            )
          }
          }
        </Form>
        <div className="mbot terms">
          <div className="">
            <span className="">
              <input
                type="checkbox"
                className=""
                data-testid="termsAndConditions-internal-checkbox"
                aria-labelledby="terms-and-conditions"
                id="termsAndConditions"
              />
            </span>
            <span className="" id="terms-and-conditions" data-testid="typography">
              I agree to the&nbsp;
              <a aria-label="Terms &amp; Conditions">
                <span>Terms &amp; Conditions</span>
              </a>
              &nbsp;for this hotel reservation(s) and the&nbsp;
              <a
                href="https://www.mgmresorts.com/en/terms-of-use.html"
                aria-label="Terms of Use"
              >
                <span>Terms of Use</span>
              </a>
              &nbsp;and acknowledge that I have read and understand the&nbsp;
              <a
                href="https://www.mgmresorts.com/en/privacy-policy.html"
                aria-label="Privacy Policy"
              >
                <span>Privacy Policy</span>
              </a>
              &nbsp;(which governs the information I provide). Our&nbsp;
              <a href="https://www.mgmresorts.com/notice-of-collection">
                <span>
                  California Notice at Collection of Personal Information
                </span>
              </a>
              describes the categories of personal information and sensitive
              personal information we collect and provides certain details about
              our processing of that information.
            </span>
          </div>
        </div>
      </div>
      <div className="divider"></div>
      <div className="mbot">
        <div className="">
          Copyright © 2023 MGM Resorts International. All rights reserved.
        </div>
        <div>
          <a href="/en/privacy-policy.html" target="_blank" className="">
            Privacy Policy
          </a>
          <a href="/en/terms-of-use.html" target="_blank" className="">
            Terms of Use
          </a>
          <a href="https://www.mgmresorts.com/ccpa" target="blank" className="">
            California Do Not Sell/Share My Personal Information
          </a>
        </div>
      </div>


      <div className="mbot">
        {name &&
          cardNumber &&
          expiryMonth &&
          expiryYear &&
          cvvValue &&
          country &&
          address &&
          state &&
          zip ? (
          <button
            className="sc-bxivhb gSIuog sc-jTzLTM cLoZFB"
            data-testid="next-button"
          >
            <span>Complete Purchase</span>
          </button>
        ) : (
          <div></div>
        )}
      </div>
    </div>
  );
};

export default PaymentWidget;

