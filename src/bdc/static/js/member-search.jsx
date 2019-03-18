import {
    fetchAuth,
    isMemberIdMlc,
    getAPIBaseURL,
    NavbarTitle,
    SelectizeUtils
} from 'Utils'


const { Input } = FRC

import {
    BootstrapTable,
    TableHeaderColumn
} from 'react-bootstrap-table'
import 'node_modules/react-bootstrap-table/dist/react-bootstrap-table.min.css'


const MemberSearchForm = React.createClass({

    mixins: [FRC.ParentContextMixin],

    propTypes: {
        children: React.PropTypes.node
    },

    render() {
        return (
            <Formsy.Form
                className={this.getLayoutClassName()}
                {...this.props}
                ref="membersearch"
            >
                {this.props.children}
            </Formsy.Form>
        );
    }
});

class MemberSearchPage extends React.Component {

    constructor(props) {
        super(props);

        // Default state
        this.state = {
            canSubmit: false,
            searchValue: undefined,
            searchString: undefined,
            searchResults: undefined
        }
    }

    onSearchChange = (event, search) => {
        // Search for members, using ?login= OR ?name=
        var searchString = null;

        if (!search || search.length < 3) {
            this.setState({searchResults: undefined})
            return false;
        }
        else if (search) {
            var searchUpperCase = search.toUpperCase()

            {/*
                if ((searchUpperCase.startsWith("E", 0) ||
                    searchUpperCase.startsWith("Z", 0)) &&
                    search.length === 6)
                    var searchString = '?login=' + searchUpperCase
                else
                    var searchString = '?name=' + search 
            */}
            var searchString = '?keyword=' + search

            // We use fetch API to ... fetch members for this login / email
            var computeSearch = (search) => {
                var searchResults = _.chain(search.result.pageItems)
                    .map(function(item){
                            {/* 
                                @WARNING : item properties can be display and shortDisplay instead of username and name
                                This depends on the Cyclos configuration
                            */}
                            return {name: item.name, email: item.email,
                                    id: item.id, login: item.username, accountNumber: item.accountNumber}
                    })
                    .sortBy(function(item){ return item.name })
                    .value()

                    {/*
                        .map(function(item){
                        if (item.login.startsWith("E", 0))
                            return {name: item.firstname + " " + item.lastname,
                                    id: item.id, login: item.login}

                        else if (item.login.startsWith("Z", 0))
                            return {name: item.company, id: item.id, login: item.login}
                        })
                    */}

                this.setState({searchResults: searchResults})
            }
            fetchAuth(this.props.search_url + searchString, this.props.method, computeSearch)
        }
    }

    render = () => {
        if (this.state.searchResults)
        {
            const selectRowProp = {
                mode: 'radio',
                clickToSelect: true,
                hideSelectColumn: true,
                onSelect: (row, isSelected, event) => {
                    window.location.assign("/members/" + row.id)
                }
            }

            var searchResultsTable = (
                <BootstrapTable data={this.state.searchResults} striped={true} hover={true} selectRow={selectRowProp}>
                    <TableHeaderColumn dataField="login" isKey={true} width="100px">{__("Login")}</TableHeaderColumn>
                    <TableHeaderColumn dataField="email">{__("Email")}</TableHeaderColumn>
                    <TableHeaderColumn dataField="name">{__("Nom")}</TableHeaderColumn>
                </BootstrapTable>
            )
        }
        else
            var searchResultsTable = (
                <div className="col-sm-offset-4">
                    <span className="search-no-results">{__("Pas de résultat")}</span>
                </div>
            )

        return (
            <div className="row">
                <div className="row">
                    <MemberSearchForm
                        ref="membersearch">
                        <fieldset>
                            <div className="form-group row">
                                <label className="control-label col-md-1"></label>
                                <div className="col-md-5">
                                    <Input
                                        name="searchValue"
                                        data-mlc="membersearch-login"
                                        value=""
                                        type="text"
                                        placeholder={__("Recherche d'un adhérent")}
                                        help={__("Saisir Login ou email")}
                                        onChange={this.onSearchChange}
                                        layout="elementOnly"
                                    />
                                </div>
                                {/* <div className="col-md-2">
                                  <a href="/members/add">
                                    <button type="button" className="btn btn-success">{__("Nouvel adhérent")}</button>
                                  </a>
                                </div> */}
                            </div>
                        </fieldset>
                    </MemberSearchForm>
                </div>
                <div className="row">
                    <div className="col-md-9 search-results">
                        {searchResultsTable}
                    </div>
                </div>
            </div>
        )
    }
}


ReactDOM.render(
    <MemberSearchPage search_url={getAPIBaseURL + "members/"} member_url="/members/" method="GET" />,
    document.getElementById('member-search')
)

ReactDOM.render(
    <NavbarTitle title={__("Recherche d'un adhérent")} />,
    document.getElementById('navbar-title')
)
