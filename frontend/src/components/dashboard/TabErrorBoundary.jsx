import React from "react";

class TabErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, errorMessage: '' };
    }

    static getDerivedStateFromError(error) {
        return {
            hasError: true,
            errorMessage: error?.message || 'Unexpected error'
        };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Tab render error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-6">
                    <h3 className="text-lg font-bold text-red-700 mb-2">Unable to load this section</h3>
                    <p className="text-sm text-red-600 mb-4">{this.state.errorMessage}</p>
                    <button
                        onClick={() => this.setState({ hasError: false, errorMessage: '' })}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
                    >
                        Retry
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default TabErrorBoundary;
