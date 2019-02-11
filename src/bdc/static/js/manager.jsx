import {
    fetchAuth,
    getAPIBaseURL,
    NavbarTitle,
} from 'Utils'

class Manager extends React.Component {
    constructor(props) {
        super(props)


        // Default state
        this.state = {
            stockBilletsData: undefined,
            caisseEuroData: undefined,
            caisseMlcData: undefined,
            retourMlcData: undefined,
        }

        // Get Accounts Summaries:
        // Stock de billets: stock_de_billets_bdc
        // Caisse euros: caisse_euro_bdc
        // Caisse mlc: caisse_mlc_bdc
        // Retour mlc: retours_d_mlc_bdc
        var computeManagerData = (data) => {
            this.setState({
                stockBilletsData: _.filter(data, (item) => { return item.type.id == "stock_de_billets_bdc" })[0],
                caisseEuroData: _.filter(data, (item) => { return item.type.id == "caisse_euro_bdc" })[0],
                caisseMlcData: _.filter(data, (item) => { return item.type.id == "caisse_mlc_bdc" })[0],
                retourMlcData: _.filter(data, (item) => { return item.type.id == "retours_d_mlc_bdc" })[0]
            })
        }
        fetchAuth(getAPIBaseURL + "accounts-summaries/", 'get', computeManagerData)
    }

    render() {
        return (
            <div className="col-md-10">
                <StockBillets data={this.state.stockBilletsData} />
                <CaisseEuro data={this.state.caisseEuroData} />
                {/*<CaisseMlc data={this.state.caisseMlcData} />*/}
                <RetourMlc data={this.state.retourMlcData} />
            </div>
        )
    }
}

var StockBillets = React.createClass({
    getInitialState() {
        return {
            balance: '',
            currency: '',
        }
    },

    componentWillReceiveProps(nextProps) {
        if (nextProps.data) {
            this.setState({balance: nextProps.data.balance,
                           currency: nextProps.data.currency})
        }
    },

    render() {
        return (
            <div className="panel panel-info">
                <div className="panel-heading">
                    <h3 className="panel-title">{__("Stock de billets — Mlc disponibles pour le change (conversions + retraits de compte numérique)")}</h3>
                </div>
                <div className="panel-body">
                    <div className="row">
                        <div className="col-md-8 col-sm-4">
                            <label className="control-label col-md-3">{__("Solde")} :</label>&nbsp;
                            <span className="col-md-5">{this.state.balance + " " + this.state.currency}</span>
                        </div>
                        <div className="col-md-4">
                            <a href="/manager/history/stock-billets" data-mlc="history-stock-billets" className="btn btn-default">{__("Historique")}</a>
                        </div>
                    </div>
                    <div className="row margin-top">
                        <div className="col-md-offset-2 col-md-2 col-sm-4">
                            <a href="/manager/entree-stock" data-mlc="entree-stock" className="btn btn-info">{__("Entrée")}</a>
                        </div>
                        <div className="col-md-offset-2 col-md-2 col-sm-4">
                            <a href="/manager/sortie-stock" data-mlc="sortie-stock" className="btn btn-default">{__("Sortie")}</a>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
})

var CaisseEuro = React.createClass({
    getInitialState() {
        return {
            balance: '',
            currency: '',
            cash: '',
            cheques: '',
        }
    },

    componentDidMount() {
        var computeData = (data) => {
            // Si un paiement n'a pas de champ personnalisé "Mode de paiement",
            // alors il faut le compter dans les espèces
            // (c'est le cas pour les paiements de type "Paiement de Banque de dépôt vers Caisse € BDC").
            var cheques_res = _.filter(data.result.pageItems,
                (i) => {
                    // Firstly, I need to verify if i.customValues.field.internalName == "mode_de_paiement"
                    // If this is true, I have to verify that a field is = Chèque
                    var res = _.filter(
                        i.customValues,
                            (j) => {
                                if (j.field.internalName == 'mode_de_paiement') {
                                    return j.enumeratedValues[0].value == 'Chèque'
                                }
                                else {
                                    return false
                                }
                            }
                    )

                    if (_.isEmpty(res)) {
                        return false
                    }
                    else {
                        return true
                    }
                })

            var cash_res = _.filter(data.result.pageItems,
                (i) => {
                    if (i.description == "Espèces non déposées")
                        return true 
                    else {
                        // Firstly, I need to verify if i.customValues.field.internalName == "mode_de_paiement"
                        // If this is true, I have to verify that a field is = Espèces
                        var res = _.filter(
                            i.customValues,
                                (j) => {
                                    if (j.field.internalName == 'mode_de_paiement') {
                                        return j.enumeratedValues[0].value == 'Espèces'
                                    }
                                    else {
                                        return false
                                    }
                                }
                        )

                        if (_.isEmpty(res)) {
                            return false
                        }
                        else {
                            return true
                        }
                    }
                })

            this.setState({cash: _.reduce(cash_res,
                                          (memo, row) => {
                                            return memo + Number(row.amount)
                                          }, Number(0)),
                           cheques: _.reduce(cheques_res,
                                             (memo, row) => {
                                                return memo + Number(row.amount)
                                             }, Number(0))
            })
        }
        fetchAuth(getAPIBaseURL +
                  "accounts-history/?account_type=caisse_euro_bdc&" +
                  "filter=a_remettre_a_l_assocation&" +
                  "direction=CREDIT",
                  'get', computeData)
    },

    componentWillReceiveProps(nextProps) {
        if (nextProps.data) {
            this.setState({balance: nextProps.data.balance,
                           currency: nextProps.data.currency})
        }
    },

    render() {
        return (
            <div className="panel panel-info">
                <div className="panel-heading">
                {/*  <h3 className="panel-title">{__("Caisse € — Euros des changes et cotisations")}</h3> */}
                    <h3 className="panel-title">{__("Caisse € — Euros des changes")}</h3>
                </div>
                <div className="panel-body">
                    <div className="row">
                        <div className="col-md-8 col-sm-4">
                            <label className="control-label col-md-3">{__("Solde")} :</label>&nbsp;
                            <span className="col-md-5">{this.state.balance + " " + this.state.currency}</span>
                        </div>
                        <div className="col-md-4">
                            <a href="/manager/history/caisse-euro" data-mlc="history-caisse-euro" className="btn btn-default">{__("Historique")}</a>
                        </div>
                    </div>
                     <div className="row">
                        <div className="col-md-8 col-sm-4">
                            <label className="control-label col-md-3">{__("Espèces")} :</label>&nbsp;
                            <span className="col-md-5">{this.state.cash + " " + this.state.currency}</span>
                        </div>
                    </div>
                    <div className="row margin-top">
                        <div className="col-md-8 col-sm-4">
                            <label className="control-label col-md-3">{__("Chèques")} :</label>&nbsp;
                            <span className="col-md-5">{this.state.cheques + " " + this.state.currency}</span>
                        </div>
                    </div>
                    <div className="row margin-top">
                        <div className="col-md-offset-2 col-md-2 col-sm-4">
                            <a href="/manager/bank-deposit" data-mlc="bank-deposit" className="btn btn-info">{__("Dépôt en banque")}</a>
                        </div>
                        <div className="col-md-offset-2 col-md-2 col-sm-4">
                            <a href="/manager/cash-deposit" data-mlc="cash-deposit" className="btn btn-default">{__("Remise de monnaie à l'Association")}</a>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
})

{/* var CaisseMlc = React.createClass({
    getInitialState() {
        return {
            balance: '',
            currency: '',
        }
    },

    componentWillReceiveProps(nextProps) {
        if (nextProps.data) {
            this.setState({balance: nextProps.data.balance,
                           currency: nextProps.data.currency})
        }
    },

    render() {
        return (
            <div className="panel panel-info">
                <div className="panel-heading">
                    <h3 className="panel-title">{__("Caisse mlc — Mlc des cotisations")}</h3>
                </div>
                <div className="panel-body">
                    <div className="row">
                        <div className="col-md-8 col-sm-4">
                            <label className="control-label col-md-3">{__("Solde")} :</label>&nbsp;
                            <span className="col-md-5">{this.state.balance + " " + this.state.currency}</span>
                        </div>
                        <div className="col-md-4">
                            <a href="/manager/history/caisse-mlc" data-mlc="history-caisse-mlc" className="btn btn-default">{__("Historique")}</a>
                        </div>
                    </div>
                    <div className="row margin-top">
                        <div className="col-md-offset-2 col-md-2 col-sm-4">
                            <a href="/manager/sortie-caisse-mlc" data-mlc="sortie-caisse-mlc" className="btn btn-info">{__("Sortie")}</a>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}) */}
{/* Dépôts d'Mlc sur un compte numérique */}
var RetourMlc = React.createClass({
    getInitialState() {
        return {
            balance: '',
            currency: '',
        }
    },

    componentWillReceiveProps(nextProps) {
        if (nextProps.data) {
            this.setState({balance: nextProps.data.balance,
                           currency: nextProps.data.currency})
        }
    },

    render() {
        return (
            <div className="panel panel-info">
                <div className="panel-heading">
                    <h3 className="panel-title">{__("Retours d'mlc — Mlc retournés pour être reconvertis en € (mlcs des crédits de compte numérique)")}</h3>
                </div>
                <div className="panel-body">
                    <div className="row">
                        <div className="col-md-8 col-sm-4">
                            <label className="control-label col-md-3">{__("Solde")} :</label>&nbsp;
                            <span className="col-md-5">{this.state.balance + " " + this.state.currency}</span>
                        </div>
                        <div className="col-md-4">
                            <a href="/manager/history/retour-mlc" data-mlc="history-retour-mlc" className="btn btn-default">{__("Historique")}</a>
                        </div>
                    </div>
                    <div className="row margin-top">
                        <div className="col-md-offset-2 col-md-2 col-sm-4">
                            <a href="/manager/sortie-retour-mlc" data-mlc="sortie-retour-mlc" className="btn btn-info">{__("Sortie")}</a>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
})

ReactDOM.render(
    <Manager />,
    document.getElementById('manager')
)

ReactDOM.render(
    <NavbarTitle title={__("Gestion")} />,
    document.getElementById('navbar-title')
)
