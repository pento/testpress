/**
 * External dependencies
 */
import React, { Component } from 'react';

/**
 * Internal dependencies
 */
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
				<div className="tabs__headings">
					{ Object.keys( tabs ).map( ( label ) => {
						const statusClassName = label === activeTab ? 'tabs__heading--active' : 'tabs__heading--inactive';
						return (
							<span
								className={ `tabs__heading ${ statusClassName }` }
								onClick={ () => this.setState( { activeTab: label } ) }
								key={ label + '-tab' }
							>
								{ label }
							</span>
						);
					} ) }
				</div>
				<div className="tabs__pages">
					{ Object.keys( tabs ).map( ( label ) => {
						const statusClassName = label === activeTab ? 'tabs__page--active' : 'tabs__page--inactive';
						return (
							<div
								className={ `tabs__page tabs__page-${ label.toLowerCase() } ${ statusClassName } ` }
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
