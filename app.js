class App extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        url: '',
        urls: []
      };
    }
  
    componentDidMount() {
      // サーバーから登録済みのURLを取得
      fetch('fetch_urls.php')
        .then(response => response.json())
        .then(data => this.setState({ urls: data }))
        .catch(error => console.error('Error:', error));
    }
  
    handleUrlChange = (e) => {
      this.setState({ url: e.target.value });
    }
  
    handleRegister = () => {
      const { url, urls } = this.state;
  
      // URLをサーバーに送信して保存
      fetch('register_url.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url })
      })
      .then(response => response.json())
      .then(data => {
        this.setState({ urls: [...urls, data], url: '' });
      })
      .catch(error => console.error('Error:', error));
    }
  
    handleDelete = (urlToDelete) => {
      const { urls } = this.state;
  
      // サーバーからURLを削除
      fetch('delete_url.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: urlToDelete })
      })
      .then(() => {
        this.setState({ urls: urls.filter(url => url !== urlToDelete) });
      })
      .catch(error => console.error('Error:', error));
    }
  
    render() {
      const { url, urls } = this.state;
  
      return (
        <div className="container adjustable">
          <h1>URL 登録サイト</h1>
          <input
            type="text"
            className="url-input"
            value={url}
            onChange={this.handleUrlChange}
            placeholder="URLを入力"
          />
          <button onClick={this.handleRegister}>登録</button>
          <div className="url-list">
            {urls.map((url, index) => (
              <div key={index} className="url-item">
                <span>{url}</span>
                <button onClick={() => this.handleDelete(url)}>削除</button>
              </div>
            ))}
          </div>
        </div>
      );
    }
  }
  
  ReactDOM.render(<App />, document.getElementById('root'));
  