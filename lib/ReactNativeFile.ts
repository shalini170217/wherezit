export class ReactNativeFile {
  uri: string;
  name: string;
  type: string;

  constructor({ uri, name, type }: { uri: string; name: string; type: string }) {
    this.uri = uri;
    this.name = name;
    this.type = type;
  }
}
