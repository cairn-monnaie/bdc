import {
    fetchAuth,
    getAPIBaseURL,
    NavbarTitle,
    isPositiveNumeric,
    SelectizeUtils
} from 'Utils'

import ModalMlc from 'Modal'

const {
    Input,
    Row
} = FRC


import classNames from 'classnames'

const {
    ToastContainer
} = ReactToastr
const ToastMessageFactory = React.createFactory(ReactToastr.ToastMessage.animation)

Formsy.addValidationRule('isPositiveNumeric', isPositiveNumeric)

const MemberDepotMlcNumeriqueForm = React.createClass({

    mixins: [FRC.ParentContextMixin],

    propTypes: {
        children: React.PropTypes.node
    },

    render() {
        return (
            <Formsy.Form
                className={this.getLayoutClassName()}
                {...this.props}
                ref="memberdepot-mlc-numerique"
            >
                {this.props.children}
            </Formsy.Form>
        );
    }
});

class MemberDepotMlcNumeriquePage extends React.Component {

    constructor(props) {
        super(props);

        // Default state
        this.state = {
            canSubmit: false,
            memberID: document.getElementById("member_id").value,
            member: undefined,
            validAmount: false,
            account: undefined,
            isModalOpen: false,
            formData: undefined,
            modalBody: undefined
        }

        // Get member data
        var computeMemberData = (member) => {
            this.setState({member: member})
        }
        fetchAuth(getAPIBaseURL + "members/" + this.state.memberID + "/", 'get', computeMemberData)

        var computeAccountData = (account) => {
            this.setState({account: account})
        }
        fetchAuth(getAPIBaseURL + "available-electronic-mlc/", 'get', computeAccountData)

    }

    onChangeAmount = (event, amount) => {
        // Input change amount

        if (amount) {
            // We use fetch API to fetch money safe account balance
            var getAvailableAmount = (account) => {
                if(account.balance < amount){
                    this.setState({validAmount: false}, this.validateForm)
                }else{
                    this.setState({validAmount: true}, this.validateForm)
                }
            }
            fetchAuth(getAPIBaseURL + "available-electronic-mlc/", 'get', getAvailableAmount)
        }
    }

    validateForm = () => {
        if (this.state.validAmount)
            this.enableButton()
        else
            this.disableButton()
    }

    enableButton = () => {
        this.setState({canSubmit: true})
    }

    disableButton = () => {
        this.setState({canSubmit: false})
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
        data.login_bdc = window.config.userName

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

                            {/*f (item.startsWith("Z")) {
                                var name = item + ' - ' + this.state.member.company
                            }
                            else {
                                var name = item + ' - ' + this.state.member.firstname + ' ' + this.state.member.lastname
                            }*/}
                            return {'label': __('N° adhérent - Nom'), order: 1, 'value': name}
                            break;
                        case 'amount':
                            return {'label': __('Montant'), 'value': item, order: 2}
                            break;
                        case 'login_bdc':
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

        if (this.state.member) {
//            if (this.state.member.company)
//                var memberName = this.state.member.company
            var memberName = this.state.member.name
//            else
//                var memberName = this.state.member.firstname + " " + this.state.member.lastname
            var memberLogin = this.state.member.username
        }
        else {
            var memberName = null
            var memberLogin = null
        }

        if (this.state.account) {
            var amountLabel = "Montant (max. " + this.state.account.balance + ")"
        }


        return (
            <div className="row">
                <MemberDepotMlcNumeriqueForm
                    onValidSubmit={this.buildForm}
                    onInvalid={this.disableButton}
                    onValid={this.enableButton}
                    ref="memberdepot-mlc-numerique">
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
                                htmlFor="memberdepot-mlc-numerique-fullname">
                                {__("Nom")}
                            </label>
                            <div className="col-sm-6 memberdepot-mlc-numerique control-label text-align-left"
                                 data-mlc="memberdepot-mlc-numerique-fullname">
                                {memberName}
                            </div>
                            <div className="col-sm-3"></div>
                        </div>
                        <Input
                            name="amount"
                            data-mlc="depot-mlc-numerique-amount"
                            value=""
                            label={amountLabel}
                            type="number"
                            placeholder={__("Montant du dépot")}
                            validations="isPositiveNumeric"
                            onChange={this.onChangeAmount}
                            onBlur={this.validateForm}
                            validationErrors={{
                                isPositiveNumeric: __("Montant invalide.")
                            }}
                            elementWrapperClassName={[{'col-sm-9': false}, 'col-sm-5']}
                            required
                        />
                    </fieldset>
                    <fieldset>
                        <Row layout="horizontal">
                            <input
                                name="submit"
                                data-mlc="memberdepot-mlc-numerique-submit"
                                type="submit"
                                defaultValue={__("Enregistrer")}
                                className="btn btn-success"
                                formNoValidate={true}
                                disabled={!this.state.canSubmit}
                            />
                        </Row>
                    </fieldset>
                </MemberDepotMlcNumeriqueForm>
                <ToastContainer ref="container"
                                toastMessageFactory={ToastMessageFactory}
                                className="toast-top-right toast-top-right-navbar" />
                <ModalMlc hideModal={this.hideModal} isModalOpen={this.state.isModalOpen}
                            modalBody={this.state.modalBody}
                            modalTitle={__("Dépôt sur le compte") + " - " + __("Confirmation")}
                            onValidate={this.submitForm}
                />
            </div>
        )
    }
}


ReactDOM.render(
    <MemberDepotMlcNumeriquePage url={getAPIBaseURL + "depot-mlc-numerique/"} method="POST" />,
    document.getElementById('depot-mlc-numerique')
)

ReactDOM.render(
    <NavbarTitle title={__("Dépôt sur le compte")} />,
    document.getElementById('navbar-title')
)
