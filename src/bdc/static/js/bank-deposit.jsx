import {
    fetchAuth,
    getAPIBaseURL,
    isPositiveNumeric,
    NavbarTitle,
    SelectizeUtils
} from 'Utils'

const {
    Input,
    Checkbox,
    Row
} = FRC

import {
    BootstrapTable,
    TableHeaderColumn
} from 'react-bootstrap-table'
import 'node_modules/react-bootstrap-table/dist/react-bootstrap-table.min.css'

import ReactSelectize from 'react-selectize'
const SimpleSelect = ReactSelectize.SimpleSelect

import classNames from 'classnames'

const {
    ToastContainer
} = ReactToastr
const ToastMessageFactory = React.createFactory(ReactToastr.ToastMessage.animation)

Formsy.addValidationRule('isPositiveNumeric', isPositiveNumeric)

const BankDepositForm = React.createClass({

    mixins: [FRC.ParentContextMixin],

    propTypes: {
        children: React.PropTypes.node
    },

    render() {
        return (
            <Formsy.Form
                className={this.getLayoutClassName()}
                {...this.props}
                ref="bank-deposit"
            >
                {this.props.children}
            </Formsy.Form>
        );
    }
});

var BankDepositPage = React.createClass({

    getInitialState() {
        return {
            canSubmit: false,
            historyTableData: undefined,
            historyTableSelectedRows: Array(),
            paymentModeList: undefined,
            depositBankList: undefined,
            depositBank: undefined,
            depositAmount: "",
            depositCalculatedAmount: Number(0),
            displayWarningPlusDifference: false,
            displayWarningMinusDifference: false,
            amountDifference: undefined,
            bordereau: undefined,
            disableBordereau: false,
            displayCustomAmount: false,
        }
    },

    componentDidMount() {
        // Get payment_modes
        var computePaymentModes = (paymentModes) => {
            // 'Euro-LIQ'
            // 'Euro-CHQ'
            // 'Eusko-LIQ' <- We don't want the eusko payment mode in this page.
            this.setState({paymentModeList: _.chain(paymentModes)
                           .filter((item) => { return item.value.toLowerCase().indexOf("eusko") === -1 })
                           .sortBy((item) => { return item.label })
                           .value()
                           })
        }
        fetchAuth(getAPIBaseURL + "payment-modes/", 'get', computePaymentModes)

        // Get depositBankList
        var computeBankDepositList = (depositBankList) => {
            this.setState({depositBankList: _.sortBy(depositBankList, (item) => { return item.label })})
        }
        fetchAuth(getAPIBaseURL + "deposit-banks/", 'get', computeBankDepositList)

        // Get historyTableData
        var computeHistoryTableData = (historyTableData) => {
            // I only want to display items which status is "A remettre à Euskal Moneta"
            this.setState({historyTableData: _.filter(
                historyTableData.result.pageItems,
                (item) => {
                    if (_.findWhere(item.statuses, {name: "A remettre à Euskal Moneta"})) {
                        return item
                    }
                })
            })
        }
        fetchAuth(getAPIBaseURL + "payments-available-deposit/", 'get', computeHistoryTableData)
    },

    // paymentMode
    paymentModeOnValueChange(item) {
        this.setState({paymentMode: item, depositAmount: ""}, this.validateForm)

        // Display custom amount field ?
        if (item && item.value.toLowerCase() === 'euro-liq')
            this.setState({displayCustomAmount: true})
        else
            this.setState({displayCustomAmount: false,
                           depositAmount: "",
                           displayWarningPlusDifference: false,
                           displayWarningMinusDifference: false})

        // TODO filter historyTableData ?
    },

    // depositBank
    depositBankOnValueChange(item) {
        this.setState({depositBank: item}, this.validateForm)
    },

    depositAmountOnBlur() {
        if (this.state.displayCustomAmount && this.state.depositCalculatedAmount != Number(0))
        {
            var numDepositAmount = Number(this.state.depositAmount)
            var numDepositCalculatedAmount = Number(this.state.depositCalculatedAmount)
            var diff = numDepositAmount - numDepositCalculatedAmount

            if ((numDepositAmount === numDepositCalculatedAmount) || !isPositiveNumeric(null, this.state.depositAmount)) {
                this.setState({displayWarningPlusDifference: false,
                               displayWarningMinusDifference: false},
                              this.validateForm)
            }
            else {
                if (numDepositAmount > numDepositCalculatedAmount) {
                    this.setState({displayWarningPlusDifference: true,
                                   displayWarningMinusDifference: false,
                                   amountDifference: diff},
                                  this.validateForm)
                }
                else {
                    this.setState({displayWarningPlusDifference: false,
                                   displayWarningMinusDifference: true,
                                   amountDifference: diff},
                                  this.validateForm)
                }
            }
        }
        else {
            this.setState({displayWarningPlusDifference: false,
                           displayWarningMinusDifference: false},
                          this.validateForm)
        }
    },

    onFormChange(event, value) {
        this.setState({[event]: value}, this.depositAmountOnBlur)
    },

    onSelectTableRow(row, isSelected, event) {
        var baseNumber = Number(this.state.depositCalculatedAmount)
        var historyTableSelectedRows = this.state.historyTableSelectedRows

        if (Number.isNaN(baseNumber))
            var baseNumber = Number(0)

        if (isSelected) {
            historyTableSelectedRows.push(row)
            this.setState({depositCalculatedAmount: baseNumber + Number(row.amount),
                           historyTableSelectedRows: historyTableSelectedRows},
                          this.depositAmountOnBlur)
        }
        else {
            this.setState({depositCalculatedAmount: baseNumber - Number(row.amount),
                           historyTableSelectedRows: _.filter(historyTableSelectedRows,
                            (item) => {
                                if (row != item)
                                    return item
                            })
                          }, this.depositAmountOnBlur)
        }
    },

    onSelectTableAll(isSelected, rows) {
        if (isSelected) {
            this.setState({depositCalculatedAmount: _.reduce(rows,
                                (memo, row) => {
                                    return memo + Number(row.amount)
                                }, Number(0)),
                           historyTableSelectedRows: rows},
                          this.depositAmountOnBlur)
        }
        else {
            this.setState({depositCalculatedAmount: Number(0),
                           historyTableSelectedRows: Array()},
                          this.depositAmountOnBlur)
        }
    },

    enableButton() {
        this.setState({canSubmit: true})
    },

    disableButton() {
        this.setState({canSubmit: false})
    },

    validateForm() {
        if (this.state.paymentMode &&
            this.state.depositBank &&
            this.state.depositCalculatedAmount != Number(0) &&
            (!this.state.displayCustomAmount ||
                this.state.displayCustomAmount &&
                isPositiveNumeric(null, this.state.depositAmount)) &&
            (this.state.disableBordereau ||
                !this.state.disableBordereau &&
                this.state.bordereau)
        ) {
            this.enableButton()
        }
        else
            this.disableButton()
    },

    submitForm(data) {
        var postData = {}
        postData.login_bdc = window.config.userName
        postData.payment_mode = this.state.paymentMode.cyclos_id
        postData.deposit_bank = this.state.depositBank.value
        postData.deposit_calculated_amount = this.state.depositCalculatedAmount
        postData.deposit_amount = this.state.depositAmount
        postData.disable_bordereau = this.state.disableBordereau
        postData.bordereau = this.state.bordereau
        postData.selected_payments = this.state.historyTableSelectedRows
        postData.amount_plus_difference = this.state.displayWarningPlusDifference
        postData.amount_minus_difference = this.state.displayWarningMinusDifference

        var computeForm = (data) => {
            this.refs.container.success(
                __("L'enregistrement s'est déroulé correctement."),
                "",
                {
                    timeOut: 5000,
                    extendedTimeOut: 10000,
                    closeButton:true
                }
            )

            console.log(data)
            console.log("redirect to: /manager/history/caisse-euro")
            // window.location.assign("/manager/history/caisse-euro")
        }

        var promiseError = (err) => {
            // Error during request, or parsing NOK :(
            console.error(this.props.url, err)
            this.refs.container.error(
                __("Une erreur s'est produite lors de l'enregistrement !"),
                "",
                {
                    timeOut: 5000,
                    extendedTimeOut: 10000,
                    closeButton:true
                }
            )
        }
        fetchAuth(this.props.url, this.props.method, computeForm, postData, promiseError)
    },

    render() {
        // Should we display customAmount field
        var divCustomAmountClass = classNames({
            'form-group row': true,
            'hidden': !this.state.displayCustomAmount,
        })

        const selectRowProp = {
            mode: 'checkbox',
            clickToSelect: true,
            onSelect: this.onSelectTableRow,
            onSelectAll: this.onSelectTableAll,
        }

        // History data table
        if (this.state.historyTableData) {
            var dateFormatter = (cell, row) => {
                // !! Force moment to be french
                moment.locale('fr')
                return moment(cell).format('LLLL')
            }

            var amountFormatter = (cell, row) => {
                // Cell is a string for now,
                // we need to cast it in a Number object to use the toFixed method.
                return Number(cell).toFixed(2)
            }

            var dataTable = (
                <BootstrapTable
                 data={this.state.historyTableData} striped={true} hover={true}
                 selectRow={selectRowProp} tableContainerClass="react-bs-table-account-history"
                 options={{noDataText: __("Rien à afficher.")}}
                 >
                    <TableHeaderColumn isKey={true} hidden={true} dataField="id">{__("ID")}</TableHeaderColumn>
                    <TableHeaderColumn dataField="date" dataFormat={dateFormatter}>{__("Date")}</TableHeaderColumn>
                    <TableHeaderColumn dataField="description">{__("Libellé")}</TableHeaderColumn>
                    <TableHeaderColumn dataField="amount" dataFormat={amountFormatter}>{__("Montant")}</TableHeaderColumn>
                </BootstrapTable>
            )
        }
        else
            var dataTable = null;

        // Warning message amount difference
        var warningCustomAmountDifference = null

        if (this.state.displayWarningPlusDifference) {
            var tmpMessage = __('Attention, il y a %%% € de trop dans le dépôt !')
            var warningCustomAmountDifferenceMessage = (
                tmpMessage.replace('%%%', this.state.amountDifference)
            )

            var warningCustomAmountDifference = (
                <div className="form-group row">
                    <div className="col-md-offset-2 col-md-8 alert alert-warning alert-deposit-amount-difference">
                       {warningCustomAmountDifferenceMessage}
                    </div>
                </div>
            )
        }
        else if (this.state.displayWarningMinusDifference) {
            var tmpMessage = __('Attention, il manque %%% € dans le dépôt !')
            var warningCustomAmountDifferenceMessage = (
                tmpMessage.replace('%%%', String(this.state.amountDifference).substring(1))
            )

            var warningCustomAmountDifference = (
                <div className="form-group row">
                    <div className="col-md-offset-2 col-md-8 alert alert-warning alert-deposit-amount-difference">
                       {warningCustomAmountDifferenceMessage}
                    </div>
                </div>
            )
        }

        return (
            <div className="row">
                <div className="col-md-3 history-form">
                    <div className="row"></div>
                    <BankDepositForm
                        onValidSubmit={this.submitForm}
                        onInvalidSubmit={this.submitForm}
                        ref="bank-deposit">
                        <fieldset>
                            <div className="form-group row">
                                <label
                                    className="control-label col-sm-3"
                                    data-required="true"
                                    htmlFor="bank-deposit-payment_mode">
                                    {__("Paiement")}
                                    <span className="required-symbol">&nbsp;*</span>
                                </label>
                                <div className="col-sm-8 bank-deposit" data-eusko="bank-deposit-payment_mode">
                                    <SimpleSelect
                                        ref="select"
                                        value={this.state.paymentMode}
                                        options={this.state.paymentModeList}
                                        placeholder={__("Mode de paiement")}
                                        theme="bootstrap3"
                                        onValueChange={this.paymentModeOnValueChange}
                                        renderOption={SelectizeUtils.selectizeRenderOption}
                                        renderValue={SelectizeUtils.selectizeRenderValue}
                                        onBlur={this.validateForm}
                                        renderNoResultsFound={SelectizeUtils.selectizeNoResultsFound}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group row">
                                <label
                                    className="control-label col-sm-3"
                                    data-required="true"
                                    htmlFor="bank-deposit-payment_mode">
                                    {__("Banque")}
                                    <span className="required-symbol">&nbsp;*</span>
                                </label>
                                <div className="col-sm-8 bank-deposit" data-eusko="bank-deposit-deposit_bank">
                                    <SimpleSelect
                                        ref="select"
                                        value={this.state.depositBank}
                                        options={this.state.depositBankList}
                                        placeholder={__("Banque de dépôt")}
                                        theme="bootstrap3"
                                        onValueChange={this.depositBankOnValueChange}
                                        renderOption={SelectizeUtils.selectizeRenderOption}
                                        renderValue={SelectizeUtils.selectizeRenderValue}
                                        onBlur={this.validateForm}
                                        renderNoResultsFound={SelectizeUtils.selectizeNoResultsFound}
                                        required
                                    />
                                </div>
                            </div>
                            <Input
                                name="depositAmount"
                                data-eusko="bank-deposit-depositAmount"
                                value={this.state.depositAmount ? this.state.depositAmount : ""}
                                label={__("Montant")}
                                type="number"
                                placeholder={__("Montant du dépôt")}
                                validations="isPositiveNumeric"
                                validationErrors={{
                                    isPositiveNumeric: __("Montant invalide.")
                                }}
                                onChange={this.onFormChange}
                                onBlur={this.depositAmountOnBlur}
                                rowClassName={divCustomAmountClass}
                                elementWrapperClassName={[{'col-sm-9': false}, 'col-sm-8']}
                                required={this.state.displayCustomAmount}
                                disabled={!this.state.displayCustomAmount}
                            />
                            <div className="form-group row">
                                <label
                                    className="control-label col-sm-3"
                                    htmlFor="bank-deposit-deposit_amount">
                                    {__("Montant calculé")}
                                </label>
                                <div className="col-sm-8 bank-deposit deposit-amount-div" data-eusko="bank-deposit-deposit_bank">
                                    <span className="deposit-amount-span">
                                        {this.state.depositCalculatedAmount + " €"}
                                    </span>
                                </div>
                            </div>
                            {warningCustomAmountDifference}
                            <Input
                                name="bordereau"
                                data-eusko="bank-deposit-bordereau"
                                value=""
                                label={__("Bordereau")}
                                type="text"
                                placeholder={__("N° du bordereau de remise")}
                                validations="isExisty"
                                validationErrors={{
                                    isExisty: __("N° bordereau invalide.")
                                }}
                                disabled={this.state.disableBordereau}
                                required={!this.state.disableBordereau}
                                onChange={this.onFormChange}
                                elementWrapperClassName={[{'col-sm-9': false}, 'col-sm-8']}
                            />
                            <Checkbox
                                name="disableBordereau"
                                data-eusko="bank-deposit-noBordereau"
                                value=""
                                label={__("Je ne connais pas le n° du bordereau")}
                                onChange={this.onFormChange}
                                rowLabel=""
                            />
                        </fieldset>
                        <fieldset>
                            <Row layout="horizontal">
                                <input
                                    name="submit"
                                    data-eusko="bank-deposit-submit"
                                    type="submit"
                                    defaultValue={__("Enregistrer")}
                                    className="btn btn-success"
                                    formNoValidate={true}
                                    disabled={!this.state.canSubmit}
                                />
                            </Row>
                        </fieldset>
                    </BankDepositForm>
                </div>
                <div className="col-md-9 col-history-table">
                    <div className="row margin-right">
                        {dataTable}
                    </div>
                </div>
                <ToastContainer ref="container"
                                toastMessageFactory={ToastMessageFactory}
                                className="toast-top-right toast-top-right-navbar"
                />
            </div>
        );
    }
})


ReactDOM.render(
    <BankDepositPage url={getAPIBaseURL + "bank-deposit/"} method="POST" />,
    document.getElementById('bank-deposit')
)

ReactDOM.render(
    <NavbarTitle title={__("Dépot en banque")} />,
    document.getElementById('navbar-title')
)