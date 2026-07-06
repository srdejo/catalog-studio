export class Settings {
  constructor(
    public companyName: string,
    public logo: string | null,
    public address: string | null,
    public city: string | null,
    public phone: string | null,
    public whatsapp: string | null,
    public email: string | null,
    public website: string | null,
    public facebook: string | null,
    public instagram: string | null,
    public primaryColor: string,
    public secondaryColor: string,
  ) {}
}
