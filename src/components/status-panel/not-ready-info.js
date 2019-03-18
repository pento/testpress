/**
 * External dependencies
 */
import React from 'react';

export default function NotReadyInfo( { statuses } ) {
	return (
		<div className="status">
			<p>
				<strong>
					<span role="img" aria-label="Wait!">
						✋
					</span>
					Getting ready
				</strong>
			</p>
			<p>Please wait a moment while TestPress gets everything ready.</p>
			<p>
				{ statuses.docker === 'ready' ? '👍' : '👉' } Starting Docker…
				<br />
				{ /* TODO: Make this work */ }
				{ /* { statuses.node === 'ready' ? '👍' : '👉' } Installing node… */ }
				{ /* <br /> */ }
				{ statuses.grunt === 'ready' ? '👍' : '👉' } Compiling assets…
				<br />
				{ statuses.wordpress === 'ready' ? '👍' : '👉' } Installing WordPress…
			</p>
			<p>
				{ /* TODO: Make this button do something */ }
				{ /* <button>Show log</button> */ }
			</p>
		</div>
	);
}
