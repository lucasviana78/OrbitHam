import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PassesTable } from './passes-table';
import { PageHeader } from './layout/page-header';
import { Brand } from './brand';
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from './ui/states';
import { FieldError, FormError } from './ui/field';

describe('PassesTable', () => {
  it('renders an empty state with no passes', () => {
    render(<PassesTable passes={[]} />);
    expect(
      screen.getByText('Nenhuma passagem encontrada.'),
    ).toBeInTheDocument();
  });

  it('renders rows and a formatted elevation', () => {
    render(
      <PassesTable
        passes={[
          {
            rise: '2026-06-03T18:12:00Z',
            peak: '2026-06-03T18:18:00Z',
            set: '2026-06-03T18:24:00Z',
            max_elevation: 74.23,
          },
        ]}
      />,
    );
    expect(screen.getByText('74.2°')).toBeInTheDocument();
  });
});

describe('state components', () => {
  it('LoadingState shows the label', () => {
    render(<LoadingState label="Carregando dados" />);
    expect(screen.getByText('Carregando dados')).toBeInTheDocument();
  });

  it('ErrorState shows a fallback message', () => {
    render(<ErrorState />);
    expect(
      screen.getByText('Algo deu errado. Tente novamente.'),
    ).toBeInTheDocument();
  });

  it('EmptyState shows the message', () => {
    render(<EmptyState message="Vazio" />);
    expect(screen.getByText('Vazio')).toBeInTheDocument();
  });
});

describe('field helpers', () => {
  it('FieldError renders nothing without a message', () => {
    const { container } = render(<FieldError />);
    expect(container).toBeEmptyDOMElement();
  });

  it('FormError renders an alert with the message', () => {
    render(<FormError message="Falha" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Falha');
  });
});

describe('layout & brand', () => {
  it('PageHeader shows title and description', () => {
    render(<PageHeader title="Painel" description="desc" />);
    expect(screen.getByRole('heading', { name: 'Painel' })).toBeInTheDocument();
    expect(screen.getByText('desc')).toBeInTheDocument();
  });

  it('Brand renders the product logo', () => {
    render(<Brand />);
    expect(screen.getByAltText('OrbitHam')).toBeInTheDocument();
  });
});
