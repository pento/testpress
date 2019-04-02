/**
 * External dependencies
 */
import React, { Component } from 'react';

/**
 * Internal dependencies
 */
import './style.scss';

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
				<ul className="tabs__headings">
					{ Object.keys( tabs ).map( ( label ) => {
						const statusClassName = label === activeTab ? 'tabs__heading--active' : 'tabs__heading--inactive';
						return (
							<li key={ label + '-tab' }>
								<button
									className={ `tabs__heading ${ statusClassName }` }
									onClick={ () => this.setState( { activeTab: label } ) }
								>
									{ label }
								</button>
							</li>
						);
					} ) }
				</ul>
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
