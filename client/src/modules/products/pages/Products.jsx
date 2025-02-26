import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  Package,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Filter,
  Barcode,
  Box
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

export default function Products() {
  return (
    <div className='flex flex-col min-h-screen'>
      <main className='container flex-1 py-6'>
        <div className='flex items-center justify-between mb-6'>
          <h1 className='text-2xl font-bold tracking-tight'>
            Gestión de Productos
          </h1>
          <Button asChild>
            <Link href='/products/new'>
              <Plus className='w-4 h-4 mr-2' /> Nuevo Producto
            </Link>
          </Button>
        </div>

        <Tabs defaultValue='all' className='mb-6'>
          <div className='flex items-center justify-between'>
            <TabsList>
              <TabsTrigger value='all'>Todos</TabsTrigger>
              <TabsTrigger value='simple'>Simples</TabsTrigger>
              <TabsTrigger value='composite'>Compuestos</TabsTrigger>
            </TabsList>
            <div className='flex items-center gap-2'>
              <Button variant='outline' size='sm'>
                <Filter className='w-4 h-4 mr-2' />
                Filtrar
              </Button>
              <Select defaultValue='newest'>
                <SelectTrigger className='w-[180px]'>
                  <SelectValue placeholder='Ordenar por' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='newest'>Más recientes</SelectItem>
                  <SelectItem value='oldest'>Más antiguos</SelectItem>
                  <SelectItem value='name-asc'>Nombre (A-Z)</SelectItem>
                  <SelectItem value='name-desc'>Nombre (Z-A)</SelectItem>
                  <SelectItem value='price-asc'>
                    Precio (menor a mayor)
                  </SelectItem>
                  <SelectItem value='price-desc'>
                    Precio (mayor a menor)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='flex items-center gap-2 my-4'>
            <Input
              placeholder='Buscar productos...'
              className='max-w-sm'
              prefix={<Search className='w-4 h-4 text-muted-foreground' />}
            />
            <Select defaultValue='all-categories'>
              <SelectTrigger className='w-[180px]'>
                <SelectValue placeholder='Categoría' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all-categories'>
                  Todas las categorías
                </SelectItem>
                <SelectItem value='electronics'>Electrónica</SelectItem>
                <SelectItem value='clothing'>Ropa</SelectItem>
                <SelectItem value='food'>Alimentos</SelectItem>
                <SelectItem value='furniture'>Muebles</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <TabsContent value='all' className='mt-0'>
            <Card>
              <CardContent className='p-0'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className='w-[100px]'>Código</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className='text-right'>Precio</TableHead>
                      <TableHead className='text-right'>Stock</TableHead>
                      <TableHead className='text-right'>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className='font-medium'>PRD001</TableCell>
                      <TableCell>Laptop HP Pavilion</TableCell>
                      <TableCell>
                        <Badge variant='outline'>Electrónica</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge>Simple</Badge>
                      </TableCell>
                      <TableCell className='text-right'>$899.99</TableCell>
                      <TableCell className='text-right'>24</TableCell>
                      <TableCell className='text-right'>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant='ghost' size='sm'>
                              <MoreHorizontal className='w-4 h-4' />
                              <span className='sr-only'>Abrir menú</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end'>
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem>
                              <Barcode className='w-4 h-4 mr-2' /> Ver código de
                              barras
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Edit className='w-4 h-4 mr-2' /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem className='text-destructive'>
                              <Trash2 className='w-4 h-4 mr-2' /> Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className='font-medium'>PRD002</TableCell>
                      <TableCell>Monitor LG 27"</TableCell>
                      <TableCell>
                        <Badge variant='outline'>Electrónica</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge>Simple</Badge>
                      </TableCell>
                      <TableCell className='text-right'>$249.99</TableCell>
                      <TableCell className='text-right'>15</TableCell>
                      <TableCell className='text-right'>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant='ghost' size='sm'>
                              <MoreHorizontal className='w-4 h-4' />
                              <span className='sr-only'>Abrir menú</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end'>
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem>
                              <Barcode className='w-4 h-4 mr-2' /> Ver código de
                              barras
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Edit className='w-4 h-4 mr-2' /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem className='text-destructive'>
                              <Trash2 className='w-4 h-4 mr-2' /> Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className='font-medium'>PRD003</TableCell>
                      <TableCell>Kit Gamer Completo</TableCell>
                      <TableCell>
                        <Badge variant='outline'>Electrónica</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant='secondary'>Compuesto</Badge>
                      </TableCell>
                      <TableCell className='text-right'>$1,299.99</TableCell>
                      <TableCell className='text-right'>8</TableCell>
                      <TableCell className='text-right'>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant='ghost' size='sm'>
                              <MoreHorizontal className='w-4 h-4' />
                              <span className='sr-only'>Abrir menú</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end'>
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem>
                              <Barcode className='w-4 h-4 mr-2' /> Ver código de
                              barras
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Box className='w-4 h-4 mr-2' /> Ver componentes
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Edit className='w-4 h-4 mr-2' /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem className='text-destructive'>
                              <Trash2 className='w-4 h-4 mr-2' /> Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className='font-medium'>PRD004</TableCell>
                      <TableCell>Teclado Mecánico RGB</TableCell>
                      <TableCell>
                        <Badge variant='outline'>Electrónica</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge>Simple</Badge>
                      </TableCell>
                      <TableCell className='text-right'>$89.99</TableCell>
                      <TableCell className='text-right'>32</TableCell>
                      <TableCell className='text-right'>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant='ghost' size='sm'>
                              <MoreHorizontal className='w-4 h-4' />
                              <span className='sr-only'>Abrir menú</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end'>
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem>
                              <Barcode className='w-4 h-4 mr-2' /> Ver código de
                              barras
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Edit className='w-4 h-4 mr-2' /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem className='text-destructive'>
                              <Trash2 className='w-4 h-4 mr-2' /> Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className='font-medium'>PRD005</TableCell>
                      <TableCell>Combo Oficina</TableCell>
                      <TableCell>
                        <Badge variant='outline'>Muebles</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant='secondary'>Compuesto</Badge>
                      </TableCell>
                      <TableCell className='text-right'>$499.99</TableCell>
                      <TableCell className='text-right'>5</TableCell>
                      <TableCell className='text-right'>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant='ghost' size='sm'>
                              <MoreHorizontal className='w-4 h-4' />
                              <span className='sr-only'>Abrir menú</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end'>
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem>
                              <Barcode className='w-4 h-4 mr-2' /> Ver código de
                              barras
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Box className='w-4 h-4 mr-2' /> Ver componentes
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Edit className='w-4 h-4 mr-2' /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem className='text-destructive'>
                              <Trash2 className='w-4 h-4 mr-2' /> Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value='simple' className='mt-0'>
            <Card>
              <CardContent className='p-0'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className='w-[100px]'>Código</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead className='text-right'>Precio</TableHead>
                      <TableHead className='text-right'>Stock</TableHead>
                      <TableHead className='text-right'>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className='font-medium'>PRD001</TableCell>
                      <TableCell>Laptop HP Pavilion</TableCell>
                      <TableCell>
                        <Badge variant='outline'>Electrónica</Badge>
                      </TableCell>
                      <TableCell className='text-right'>$899.99</TableCell>
                      <TableCell className='text-right'>24</TableCell>
                      <TableCell className='text-right'>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant='ghost' size='sm'>
                              <MoreHorizontal className='w-4 h-4' />
                              <span className='sr-only'>Abrir menú</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end'>
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem>
                              <Barcode className='w-4 h-4 mr-2' /> Ver código de
                              barras
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Edit className='w-4 h-4 mr-2' /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem className='text-destructive'>
                              <Trash2 className='w-4 h-4 mr-2' /> Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className='font-medium'>PRD002</TableCell>
                      <TableCell>Monitor LG 27"</TableCell>
                      <TableCell>
                        <Badge variant='outline'>Electrónica</Badge>
                      </TableCell>
                      <TableCell className='text-right'>$249.99</TableCell>
                      <TableCell className='text-right'>15</TableCell>
                      <TableCell className='text-right'>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant='ghost' size='sm'>
                              <MoreHorizontal className='w-4 h-4' />
                              <span className='sr-only'>Abrir menú</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end'>
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem>
                              <Barcode className='w-4 h-4 mr-2' /> Ver código de
                              barras
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Edit className='w-4 h-4 mr-2' /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem className='text-destructive'>
                              <Trash2 className='w-4 h-4 mr-2' /> Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className='font-medium'>PRD004</TableCell>
                      <TableCell>Teclado Mecánico RGB</TableCell>
                      <TableCell>
                        <Badge variant='outline'>Electrónica</Badge>
                      </TableCell>
                      <TableCell className='text-right'>$89.99</TableCell>
                      <TableCell className='text-right'>32</TableCell>
                      <TableCell className='text-right'>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant='ghost' size='sm'>
                              <MoreHorizontal className='w-4 h-4' />
                              <span className='sr-only'>Abrir menú</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end'>
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem>
                              <Barcode className='w-4 h-4 mr-2' /> Ver código de
                              barras
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Edit className='w-4 h-4 mr-2' /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem className='text-destructive'>
                              <Trash2 className='w-4 h-4 mr-2' /> Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value='composite' className='mt-0'>
            <Card>
              <CardContent className='p-0'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className='w-[100px]'>Código</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead className='text-right'>Precio</TableHead>
                      <TableHead className='text-right'>Stock</TableHead>
                      <TableHead className='text-right'>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className='font-medium'>PRD003</TableCell>
                      <TableCell>Kit Gamer Completo</TableCell>
                      <TableCell>
                        <Badge variant='outline'>Electrónica</Badge>
                      </TableCell>
                      <TableCell className='text-right'>$1,299.99</TableCell>
                      <TableCell className='text-right'>8</TableCell>
                      <TableCell className='text-right'>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant='ghost' size='sm'>
                              <MoreHorizontal className='w-4 h-4' />
                              <span className='sr-only'>Abrir menú</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end'>
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem>
                              <Barcode className='w-4 h-4 mr-2' /> Ver código de
                              barras
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Box className='w-4 h-4 mr-2' /> Ver componentes
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Edit className='w-4 h-4 mr-2' /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem className='text-destructive'>
                              <Trash2 className='w-4 h-4 mr-2' /> Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className='font-medium'>PRD005</TableCell>
                      <TableCell>Combo Oficina</TableCell>
                      <TableCell>
                        <Badge variant='outline'>Muebles</Badge>
                      </TableCell>
                      <TableCell className='text-right'>$499.99</TableCell>
                      <TableCell className='text-right'>5</TableCell>
                      <TableCell className='text-right'>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant='ghost' size='sm'>
                              <MoreHorizontal className='w-4 h-4' />
                              <span className='sr-only'>Abrir menú</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end'>
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem>
                              <Barcode className='w-4 h-4 mr-2' /> Ver código de
                              barras
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Box className='w-4 h-4 mr-2' /> Ver componentes
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Edit className='w-4 h-4 mr-2' /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem className='text-destructive'>
                              <Trash2 className='w-4 h-4 mr-2' /> Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

import { BackDashBoard } from '@/components/backDash/BackDashBoard'
import { Spinner } from '@/components/loader/Spinner'

export const Products = () => {
  return (
    <>
      <BackDashBoard link={'/home'} moduleName={t('news')} />
      <div className='relative'>
        {/* Show spinner when loading or fetching */}
        {/* {(isLoading ||
          isLoadingStatus ||
          isLoadingPut ||
          isLoadingPost ||
          isLoadingDelete ||
          isFetching ||
          isFetchingStatus) && <Spinner />} */}
        <div className='flex flex-wrap items-center justify-between'></div>
      </div>
    </>
  )
}
