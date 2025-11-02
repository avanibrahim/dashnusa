<header className="border-b bg-white/70 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
  <div className="container mx-auto px-4 py-4 flex justify-between items-center">
    <div className="flex items-center gap-3">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate('/dashboard')}
        className="text-blue-900 hover:bg-blue-100"
      >
        <ArrowLeft className="w-4 h-4" />
      </Button>

      {/* Bungkus h1 dan p di sini */}
      <div className="flex flex-col">
      <h1 className="text-2xl font-bold text-blue-800">Hutang / Piutang</h1>
              <p className="text-sm text-blue-600 mt-1">
                Kelola catatan hutang & piutang kamu dengan mudah dan rapi
              </p>
      </div>
    </div>

    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          className="bg-blue-900 text-white hover:bg-blue-800 shadow-md"
          onClick={() => setEditingCategory(null)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-blue-900">
            {editingCategory ? "Edit Kategori" : "Tambah Kategori"}
          </DialogTitle>
        </DialogHeader>

        <CategoryForm category={editingCategory} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  </div>
</header>