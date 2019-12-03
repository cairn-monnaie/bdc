import {
    fetchAuth,
    getAPIBaseURL,
    isPositiveNumeric,
    NavbarTitle,
    SelectizeUtils
} from 'Utils'

import ModalMlc from 'Modal'

const {
    Input,
    Select,
    Row
} = FRC

import ReactSelectize from 'react-selectize'
const SimpleSelect = ReactSelectize.SimpleSelect

import classNames from 'classnames'

const {
    ToastContainer
} = ReactToastr
const ToastMessageFactory = React.createFactory(ReactToastr.ToastMessage.animation)

Formsy.addValidationRule('isPositiveNumeric', isPositiveNumeric)

const MemberChangeEuroMlcForm = React.createClass({

    mixins: [FRC.ParentContextMixin],

    propTypes: {
        children: React.PropTypes.node
    },

    render() {
        return (
            <Formsy.Form
                className={this.getLayoutClassName()}
                {...this.props}
                ref="memberchangeeuromlc"
            >
                {this.props.children}
            </Formsy.Form>
        );
    }
});

class MemberChangeEuroMlcPage extends React.Component {

    constructor(props) {
        super(props);

        // Default state
        this.state = {
            canSubmit: false,
            validFields: false,
            validCustomFields: false,
            memberID: document.getElementById("member_id").value,
            member: undefined,
            paymentMode: '',
            paymentModeList: '',
            isModalOpen: false,
            formData: undefined,
            modalBody: undefined
        }


        // Get member data
        var computeMemberData = (member) => {
            this.setState({member: member})
        }
        fetchAuth(getAPIBaseURL + "members/" + this.state.memberID + "/", 'get', computeMemberData)

        // Get payment_modes
        var computePaymentModes = (paymentModes) => {
            // 'Euro-LIQ'
            // 'Euro-CHQ'
            // 'Mlc-LIQ' <- Nous sommes dans un change, donc pas d'mlc en moyen de paiement...
            this.setState({paymentModeList:
                           _.filter(paymentModes, (item) => {
                                        return item.value.toLowerCase().indexOf("mlc") === -1
                                    })
                          })
        }
        fetchAuth(getAPIBaseURL + "payment-modes/", 'get', computePaymentModes)
    }

    // paymentMode
    paymentModeOnValueChange = (item) => {
        this.setState({paymentMode: item}, this.validateForm)
    }

    enableButton = () => {
        this.setState({canSubmit: true})
    }

    disableButton = () => {
        this.setState({canSubmit: false})
    }

    validFields = () => {
        this.setState({validFields: true}, this.validateForm)
    }

    validateForm = () => {
        if (this.state.paymentMode)
        {
            this.setState({validCustomFields: true})

            if (this.state.validFields)
                this.enableButton()
            else
                this.disableButton()
        }
        else
            this.disableButton()

    }

    submitForm = () => {
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

            setTimeout(() => window.location.assign("/members/" + document.getElementById("member_id").value), 3000)
        }

        var promiseError = (err) => {
            // Error during request, or parsing NOK :(
            this.enableButton()

            console.error(this.props.url, err)
            this.refs.container.error(
                __("Une erreur s'est produite lors de l'enregistrement, vérifiez si le solde est bien disponible !"),
                "",
                {
                    timeOut: 5000,
                    extendedTimeOut: 10000,
                    closeButton:true
                }
            )
        }
        fetchAuth(this.props.url, this.props.method, computeForm, this.state.formData, promiseError)
    }

    buildForm = (data) => {
        this.disableButton()

        data.member_login = this.state.member.username
        data.payment_mode = this.state.paymentMode.cyclos_id
        data.payment_mode_name = this.state.paymentMode.label

        this.setState({formData: data}, this.getModalElements)
    }

    openModal = () => {
        this.setState({isModalOpen: true})
    }

    hideModal = () => {
        this.setState({isModalOpen: false})
    }

    getModalElements = () => {
        this.setState({modalBody:
            _.map(this.state.formData,
                (item, key) => {
                    switch (key) {
                        case 'member_login':
                            var name = item + ' - ' + this.state.member.name

                            {/*
                                if (item.startsWith("Z")) {
                                var name = item + ' - ' + this.state.member.name
                            }
                            else {
                                var name = item + ' - ' + this.state.member.name
                            }
                            */}
                            return {'label': __('N° adhérent - Nom'), order: 1, 'value': name}
                            break;
                        case 'amount':
                            return {'label': __('Montant'), 'value': item, order: 2}
                            break;
                        case 'payment_mode_name':
                            return {'label': __('Mode de paiement'), 'value': item, order: 3}
                            break;
                        case 'payment_mode':
                            break;
                        default:
                            return {'label': item, 'value': item, order: 999}
                            break;
                    }
                }
            )
        }, this.openModal)
    }

    render = () => {
        var divAmountClass = classNames({
            'form-group row': true,
            'has-error has-feedback': this.state.amountInvalid,
        })

        var reactSelectizeErrorClass = classNames({
            'has-error has-feedback': this.state.amountInvalid,
        })

        if (this.state.member) {
            var memberName = this.state.member.name //this.state.member.firstname + " " + this.state.member.lastname
            var memberLogin = this.state.member.username
        }
        else {
            var memberName = null
            var memberLogin = null
        }

        return (
            <div className="row">
                <MemberChangeEuroMlcForm
                    onValidSubmit={this.buildForm}
                    onInvalid={this.disableButton}
                    onValid={this.validFields}
                    ref="memberchangeeuromlc">
                    <fieldset>
                        <div className="form-group row member-login-row">
                            <label
                                className="control-label col-sm-3"
                                htmlFor="memberretrait-mlc-numerique-fullname">
                                {__("N° Adhérent")}
                            </label>
                            <div className="col-sm-6 memberretrait-mlc-numerique control-label text-align-left"
                                 data-mlc="memberretrait-mlc-numerique-fullname">
                                {memberLogin}
                            </div>
                            <div className="col-sm-3"></div>
                        </div>
                        <div className="form-group row">
                            <label
                                className="control-label col-sm-3"
                                htmlFor="memberchangeeuromlc-fullname">
                                {__("Nom")}
                            </label>
                            <div className="col-sm-6 memberchangeeuromlc control-label text-align-left"
                                 data-mlc="memberchangeeuromlc-fullname">
                                {memberName}
                            </div>
                            <div className="col-sm-3"></div>
                        </div>
                        <Input
                            name="amount"
                            data-mlc="memberchangeeuromlc-amount"
                            value=""
                            label={__("Montant")}
                            type="number"
                            placeholder={__("Montant du change")}
                            validations="isPositiveNumeric"
                            validationErrors={{
                                isPositiveNumeric: __("Montant invalide.")
                            }}
                            elementWrapperClassName={[{'col-sm-9': false}, 'col-sm-5']}
                            required
                        />
                        <div className="form-group row">
                            <label
                                className="control-label col-sm-3"
                                data-required="true"
                                htmlFor="memberchangeeuromlc-payment_mode">
                                {__("Mode de paiement")}
                                <span className="required-symbol">&nbsp;*</span>
                            </label>
                            <div className="col-sm-5 memberchangeeuromlc" data-mlc="memberchangeeuromlc-payment_mode">
                                <SimpleSelect
                                    className={reactSelectizeErrorClass}
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
                            <div className="col-sm-3"></div>
                        </div>
                    </fieldset>
                    <fieldset>
                        <Row layout="horizontal">
                            <input
                                name="submit"
                                data-mlc="memberchangeeuromlc-submit"
                                type="submit"
                                defaultValue={__("Enregistrer le change")}
                                className="btn btn-success"
                                formNoValidate={true}
                                disabled={!this.state.canSubmit}
                            />
                        </Row>
                    </fieldset>
                </MemberChangeEuroMlcForm>
                <ToastContainer ref="container"
                                toastMessageFactory={ToastMessageFactory}
                                className="toast-top-right toast-top-right-navbar" />
                <ModalMlc hideModal={this.hideModal}
                            isModalOpen={this.state.isModalOpen}
                            modalBody={this.state.modalBody}
                            modalTitle={this.props.title + " : " + __("Confirmation")}
                            onValidate={this.submitForm}
                />
            </div>
        );
    }
}

// We use the same code for change billets and change numérique (except for POST url & page title)
if (window.location.pathname.toLowerCase().indexOf("euro-mlc-numeriques") != -1) {
    var url = getAPIBaseURL + "change-euro-mlc-numeriques/"
    var title = __("Change € - Mlc numériques")
}
else {
    var url = getAPIBaseURL + "change-euro-mlc/"
    var title = __("Change € - Mlc billets")
}

ReactDOM.render(
    <MemberChangeEuroMlcPage url={url} title={title} method="POST" />,
    document.getElementById('change-euro-mlc')
)

ReactDOM.render(
    <NavbarTitle title={title} />,
    document.getElementById('navbar-title')
)
