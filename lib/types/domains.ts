import { UUID } from './auth';

// Domain data structure from API
export interface IDomain {
  uuid: UUID;           // Unique identifier for deletion
  domain: string;       // Domain name without protocol
  comments: string;     // Optional description
  created_at: string;   // ISO timestamp
  updated_at: string;   // ISO timestamp
}

// API response for getting domains
export interface IDomainsResponse {
  domains: IDomain[];
}

// Request body for adding a domain
export interface IAddDomainRequest {
  organisationUuid: UUID;
  domain: string;
}

// Request body for deleting a domain
export interface IDeleteDomainRequest {
  organisationUuid: UUID;
  domainUuid: UUID;
}

// API response for add/delete operations
export interface IDomainOperationResponse {
  message: string;
}

// Embed script configuration
export interface IEmbedScript {
  scriptUrl: string;
  content: string;
} 