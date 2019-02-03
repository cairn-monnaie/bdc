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

const MemberRetraitMlcNumeriqueForm = React.createClass({

    mixins: [FRC.ParentContextMixin],

    propTypes: {
        children: React.PropTypes.node
    },

    render() {
        return (
            <Formsy.Form
                className={this.getLayoutClassName()}
                {...this.props}
                ref="memberretrait-mlc-numerique"
            >
                {this.props.children}
            </Formsy.Form>
        );
    }
});

class MemberRetraitMlcNumeriquePage extends React.Component {

    constructor(props) {
        super(props);

        // Default state
        this.state = {
            canSubmit: false,
            memberID: document.getElementById("member_id").value,
            member: undefined,
            isModalOpen: false,
            formData: undefined,
            modalBody: undefined
        }

        // Get member data
        var computeMemberData = (member) => {
            this.setState({member: member})
        }
        fetchAuth(getAPIBaseURL + "members/" + this.state.memberID + "/", 'get', computeMemberData)
    }

    enableButton = () => {
        this.setState({canSubmit: true})
    }

    disableButton = () => {
        this.setState({canSubmit: false})
    }

    onChangeAmount = (field, value) => {
        // nothing here
    }

    buildForm = (data) => {
        this.disableButton()

        data.member_login = this.state.member.username
        data.login_bdc = window.config.userName

        this.setState({formData: data}, this.getModalElements)
    }

    submitForm = () => {
        var computeForm = (data) => {
            console.log(this.props.url, data.error)
            if (data.error) {
                if (data.error == 'error-member-not-enough-money') {
                    this.refs.container.error(
                        __("Le compte de l'adhérent-e n'a pas un solde suffisant pour réaliser cette opération."),
                        "",
                        {
                            timeOut: 5000,
                            extendedTimeOut: 10000,
                            closeButton:true
                        }
                    )
                }
                else if (data.error == 'error-bureau-not-enough-money') {
                    this.refs.container.error(
                        __("Vous n'avez pas assez d'mlc en stock pour réaliser cette opération."),
                        "",
                        {
                            timeOut: 5000,
                            extendedTimeOut: 10000,
                            closeButton:true
                        }
                    )
                }
            }
            else {
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
        }

        var promiseError = (err) => {
            // Error during request, or parsing NOK :(
            this.enableButton()
            console.error(this.props.url, err)
            this.refs.container.error(
                __(data.error),
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

                            {/* if (item.startsWith("Z")) {
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
            var memberName = this.state.member.name

            {/*if (this.state.member.company)
                var memberName = this.state.member.company
            else
                var memberName = this.state.member.firstname + " " + this.state.member.lastname
            */}
            var memberLogin = this.state.member.username
        }
        else {
            var memberName = null
            var memberLogin = null
        }

        return (
            <div className="row">
                <MemberRetraitMlcNumeriqueForm
                    onValidSubmit={this.buildForm}
                    onInvalid={this.disableButton}
                    onValid={this.enableButton}
                    ref="memberretrait-mlc-numerique">
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
                                htmlFor="memberretrait-mlc-numerique-fullname">
                                {__("Nom")}
                            </label>
                            <div className="col-sm-6 memberretrait-mlc-numerique control-label text-align-left"
                                 data-mlc="memberretrait-mlc-numerique-fullname">
                                {memberName}
                            </div>
                            <div className="col-sm-3"></div>
                        </div>
                        <Input
                            name="amount"
                            data-mlc="retrait-mlc-numerique-amount"
                            value=""
                            label={__("Montant")}
                            type="number"
                            placeholder={__("Montant du retrait")}
                            validations="isPositiveNumeric"
                            onChange={this.onChangeAmount}
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
                                data-mlc="memberretrait-mlc-numerique-submit"
                                type="submit"
                                defaultValue={__("Enregistrer")}
                                className="btn btn-success"
                                formNoValidate={true}
                                disabled={!this.state.canSubmit}
                            />
                        </Row>
                    </fieldset>
                </MemberRetraitMlcNumeriqueForm>
                <ToastContainer ref="container"
                                toastMessageFactory={ToastMessageFactory}
                                className="toast-top-right toast-top-right-navbar" />
                <ModalMlc hideModal={this.hideModal} isModalOpen={this.state.isModalOpen}
                            modalBody={this.state.modalBody}
                            modalTitle={__("Retrait du compte") + " - " + __("Confirmation")}
                            onValidate={this.submitForm}
                />
            </div>
        )
    }
}


ReactDOM.render(
    <MemberRetraitMlcNumeriquePage url={getAPIBaseURL + "retrait-mlc-numerique/"} method="POST" />,
    document.getElementById('retrait-mlc-numerique')
)

ReactDOM.render(
    <NavbarTitle title={__("Retrait du compte")} />,
    document.getElementById('navbar-title')
)
