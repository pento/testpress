import React, { Component } from 'react';

import './style.css';

class Tabs extends Component {
	constructor() {
		super( ...arguments );

		this.state = {
			activeTab: Object.keys( this.props.tabs )[ 0 ],
		};
	}
	render() {
		const { activeTab } = this.state;
		const { tabs } = this.props;

		return (
			<div className="tabs">
				<div className="tabs-headings">
					{ Object.keys( tabs ).map( ( label ) => {
						const className = label === activeTab ? 'active' : 'inactive';
						return (
							<span
								className={ className }
								onClick={ () => this.setState( { activeTab: label } ) }
								key={ label + '-tab' }
							>
								{ label }
							</span>
						);
					} ) }
				</div>
				<div className="tabs-pages">
					{ Object.keys( tabs ).map( ( label ) => {
						const className = 'page-' + label.toLowerCase() + ' ' + ( label === activeTab ? 'active' : 'inactive' );
						return (
							<div
								className={ className }
								key={ label + '-page' }
							>
								{ tabs[ label ] }
							</div>
						);
					} ) }
				</div>
			</div>
		);
	}
}

export default Tabs;
