import * as React from 'react';
import { Book, Code, Image, Map, GitHub } from 'react-feather';
import { withRouter } from 'react-router-dom';
import { mergeConfig } from 'vega';
import { mapStateToProps } from '.';
import { Mode, BACKEND_URL, COOKIE_NAME } from '../../../constants/consts';
import './index.css';
import getCookie from '../../../utils/getCookie';

type Props = ReturnType<typeof mapStateToProps>;

interface State {
  downloadVegaJSON: boolean;
  gistFileName: string;
  gistPrivate: boolean;
  gistTitle: string;
  includeConfig: boolean;
}

class ExportModal extends React.PureComponent<Props, State> {
  constructor(props) {
    super(props);
    this.state = {
      downloadVegaJSON: false,
      gistFileName: '',
      gistPrivate: false,
      gistTitle: '',
      includeConfig: true
    };
  }

  public async downloadViz(ext: string) {
    const url = await this.props.view.toImageURL(ext);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('target', '_blank');
    link.setAttribute('download', `visualization.${ext}`);
    link.dispatchEvent(new MouseEvent('click'));
  }

  public async openViz(ext: string) {
    const url = await this.props.view.toImageURL(ext);
    const tab = window.open('about:blank', '_blank');
    tab.document.write(`<title>Chart</title><img src="${url}" />`);
    tab.document.close();
  }

  public async downloadPDF() {
    // show that we are working
    const dlButton = this.refs.downloadPDF as any;
    dlButton.classList.add('disabled');

    const svg = await this.props.view.toSVG();

    const pdf = await fetch('https://api.cloudconvert.com/convert', {
      body: JSON.stringify({
        apikey: '7ZSKlPLjDB4RUaq5dvEvAQMG5GGwEeHH3qa7ixAr0KZtPxfwsKv81sc1SqFhlh7d',
        file: svg,
        filename: 'chart.svg',
        input: 'raw',
        inputformat: 'svg',
        outputformat: 'pdf'
      }),
      headers: {
        'content-type': 'application/json; chartset=UTF-8'
      },
      method: 'post'
    });

    const blob = await pdf.blob();
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('target', '_blank');
    link.setAttribute('download', `visualization.pdf`);
    link.dispatchEvent(new MouseEvent('click'));

    dlButton.classList.remove('disabled');
  }

  public updateIncludeConfig(e) {
    this.setState({
      includeConfig: e.target.checked
    });
  }

  public downloadJSON(event) {
    if (
      event.target?.matches(`input`) ||
      event.target?.matches(`label`) ||
      event.target?.matches(`div.type-input-container`)
    ) {
      return;
    }
    let content;
    let filename: string;
    if (this.props.mode === Mode.Vega) {
      content = this.props.vegaSpec;
      filename = `visualization.vg.json`;
    } else {
      content = this.state.downloadVegaJSON ? this.props.vegaSpec : this.props.vegaLiteSpec;
      filename = this.state.downloadVegaJSON ? `visualization.vg.json` : `visualization.vl.json`;
    }

    if (this.state.includeConfig && this.props.config) {
      content = { ...content };
      content.config = mergeConfig({}, this.props.config, content.config);
    }

    const blob = new Blob([JSON.stringify(content, null, 2)], {
      type: `application/json`
    });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement(`a`);
    link.setAttribute(`href`, url);
    link.setAttribute(`target`, `_blank`);
    link.setAttribute(`download`, filename);
    link.dispatchEvent(new MouseEvent(`click`));
  }

  public updateDownloadJSONType(event) {
    this.setState({ downloadVegaJSON: event.currentTarget.value === 'vega' });
  }

  public updatePrivacy(event) {
    this.setState({
      gistPrivate: event.target.checked
    });
  }

  public fileNameChange(event) {
    this.setState({
      gistFileName: event.target.value
    });
  }

  public titleChange(event) {
    this.setState({
      gistTitle: event.target.value
    });
  }

  public createGist() {
    const body = {
      content: this.props.editorString,
      name: this.state.gistFileName,
      title: this.state.gistTitle,
      privacy: this.state.gistPrivate
    };
    console.log(this.props.editorString);
    const cookieValue = encodeURIComponent(getCookie(COOKIE_NAME));
    fetch(`${BACKEND_URL}gists/create`, {
      body: JSON.stringify(body),
      mode: 'cors',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `${COOKIE_NAME}=${cookieValue}`
      },
      method: 'post'
    })
      .then(res => res.json())
      .then(json => console.log(json));
  }

  public render() {
    return (
      <>
        <h1>Export</h1>
        <div className="exports">
          <div className="export-container">
            <div className="header-text">
              <Image />
              <span>PNG</span>
            </div>
            <p>
              PNG is a bitmap image format which is made up of a fixed number of pixels. They have a fixed resolution
              and cannot be scaled.
            </p>
            <button onClick={() => this.downloadViz('png')}>Download </button>
          </div>

          <div className="export-container">
            <div className="header-text">
              <Code />
              <span>JSON</span>
            </div>
            <p>JSON is a lightweight data-interchange format.</p>
            {this.props.mode === Mode.VegaLite && (
              <div className="input-container">
                <label>
                  <input
                    type="radio"
                    name="json-type"
                    id="json-type[vega]"
                    value="vega"
                    checked={this.state.downloadVegaJSON}
                    onChange={this.updateDownloadJSONType.bind(this)}
                  />{' '}
                  Compiled Vega
                </label>
                <label htmlFor="json-type[vega-lite]" className="vl-label">
                  <input
                    type="radio"
                    name="json-type"
                    id="json-type[vega-lite]"
                    value="vega-lite"
                    checked={!this.state.downloadVegaJSON}
                    onChange={this.updateDownloadJSONType.bind(this)}
                  />
                  Vega-Lite
                </label>
              </div>
            )}
            <div className="input-container">
              {this.state.downloadVegaJSON ? (
                <p>The compiled Vega includes the config and is formatted.</p>
              ) : (
                  <div>
                    <label>
                      <input
                        type="checkbox"
                        name="config-include"
                        id="config-include"
                        value="config-select"
                        checked={this.state.includeConfig}
                        onChange={this.updateIncludeConfig.bind(this)}
                      />
                      Include config
                  </label>
                    {this.state.includeConfig && <p>The downloaded spec will be formatted. </p>}
                  </div>
                )}
            </div>
            <button onClick={e => this.downloadJSON(e)}>Download</button>
          </div>
          <div className="export-container">
            <div className="header-text">
              <Map />
              <span>SVG</span>
            </div>
            <p>
              SVG is a vector image format which uses geometric forms to represent different parts as discrete objects
              and are infinitely scalable.
            </p>
            <button onClick={() => this.openViz('svg')} className="export-button">
              Open
            </button>
            <button onClick={() => this.downloadViz('svg')} className="export-button two">
              Download
            </button>
          </div>
          <div className="export-container" ref="downloadPDF">
            <div className="header-text">
              <Book />
              <span>PDF</span>
            </div>
            <p>
              <strong>Experimental!</strong>
              <br /> PDF is a vector format usually used for documents. This might take a few seconds. Please be
              patient. Your chart is sent to an <a href="https://cloudconvert.com/">external service</a> for processing.
            </p>
            <button onClick={() => this.downloadPDF()}>Download</button>
          </div>
          <div className="export-button-container">
            <div className="header-text">
              <GitHub />
              <span>GIST</span>
            </div>
            <p>Create a GitHub gist directly using the editor.</p>
            <div className="input-container">
              <div>
                <input
                  type="checkbox"
                  name="private-gist"
                  id="private-gist"
                  value="private-select"
                  checked={this.state.gistPrivate}
                  onChange={this.updatePrivacy.bind(this)}
                />
                <label htmlFor="private-gist">Private gist</label>
              </div>
            </div>
            <div className="input-container flex">
              <label>
                File name:
                <input
                  value={this.state.gistFileName}
                  onChange={this.fileNameChange.bind(this)}
                  className="export-button create"
                  type="text"
                  placeholder="Enter file name"
                />
              </label>
              <label>
                Title (optional):
                <input
                  value={this.state.gistTitle}
                  onChange={this.titleChange.bind(this)}
                  className="export-button create"
                  type="text"
                  placeholder="Enter title of gist (optional)"
                />
              </label>
            </div>
            <button className="export-button two" onClick={this.createGist.bind(this)}>
              Create
            </button>
          </div>
        </div>
        <div className="user-notes">
          <p>
            <strong>Note:</strong> To get a PDF, open the SVG which you can print as a PDF from your browser.
          </p>
        </div>
      </>
    );
  }
}

export default withRouter(ExportModal);
